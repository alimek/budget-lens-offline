import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  addMonths,
  applyRuleEditPlan,
  isActiveInMonth,
  monthsBetween,
  type OccurrenceOverride,
  planRuleEdit,
  type RuleEdit,
  type RuleEditState,
  type RulePatch,
  type RuleVersion,
  resolveVersionedOccurrences,
  type Schedule,
  toMinorUnits,
  toYearMonth,
  versionInForce,
  type YearMonth,
} from "./index";

// Three years of months: long enough for several versions, closed months and scheduled changes.
const FIRST_MONTH = toYearMonth("2026-01");
const MONTHS = 36;
const ALL_MONTHS = Array.from({ length: MONTHS + 12 }, (_, offset) =>
  addMonths(FIRST_MONTH, offset),
);
const offset = fc.integer({ min: 0, max: MONTHS - 1 });
const month = offset.map((index) => addMonths(FIRST_MONTH, index));
// Whole grosze only, up to 100 000 zł.
const amount = fc.integer({ min: 0, max: 10_000_000 }).map(toMinorUnits);

/** A schedule placed around `from`: the anchor may be before it, the end month after it. */
const scheduleFrom = (from: YearMonth): fc.Arbitrary<Schedule> =>
  fc.oneof(
    fc
      .record({
        intervalMonths: fc.integer({ min: 1, max: 6 }),
        anchorOffset: fc.integer({ min: -6, max: 6 }),
        endOffset: fc.option(fc.integer({ min: 0, max: 24 }), { nil: undefined }),
        dayOfMonth: fc.option(fc.integer({ min: 28, max: 31 }), { nil: undefined }),
      })
      .map(({ intervalMonths, anchorOffset, endOffset, dayOfMonth }) => {
        const anchor = addMonths(from, anchorOffset);
        return {
          kind: "recurring" as const,
          intervalMonths,
          anchor,
          ...(endOffset === undefined ? {} : { endMonth: addMonths(anchor, endOffset) }),
          ...(dayOfMonth === undefined ? {} : { dayOfMonth }),
        };
      }),
    fc
      .integer({ min: 0, max: 12 })
      .map((after) => ({ kind: "one-time" as const, month: addMonths(from, after) })),
  );

const ruleVersion: fc.Arbitrary<RuleVersion> = month.chain((effectiveFrom) =>
  fc.record({
    effectiveFrom: fc.constant(effectiveFrom),
    amount,
    schedule: scheduleFrom(effectiveFrom),
  }),
);

const override: fc.Arbitrary<OccurrenceOverride> = fc
  .record({ month, skipped: fc.boolean(), amount })
  .map(({ month, skipped, amount }) => ({
    id: `o-${month}`,
    itemType: "expense" as const,
    itemId: "item",
    month,
    ...(skipped ? { skipped } : { amount }),
  }));

const state: fc.Arbitrary<RuleEditState> = fc
  .record({
    versions: fc.uniqueArray(ruleVersion, {
      minLength: 1,
      maxLength: 4,
      selector: (version) => version.effectiveFrom,
    }),
    overrides: fc.uniqueArray(override, { maxLength: 6, selector: (override) => override.month }),
  })
  .map(({ versions, overrides }) => ({
    item: { id: "item", itemType: "expense" as const, versions },
    overrides,
  }));

const patch = (from: YearMonth): fc.Arbitrary<RulePatch> =>
  fc.record({ amount, schedule: scheduleFrom(from) }, { requiredKeys: [] });

/** Edits starting in a month from the active month on (or a random existing version). */
const edit = (activeMonth: YearMonth, versions: readonly RuleVersion[]): fc.Arbitrary<RuleEdit> => {
  const from = fc.integer({ min: 0, max: 12 }).map((after) => addMonths(activeMonth, after));
  const versionFrom = fc.constantFrom(...versions.map(({ effectiveFrom }) => effectiveFrom));
  return fc.oneof(
    fc
      .record({ from, replaceScheduled: fc.boolean(), resetKeptOverrides: fc.boolean() })
      .chain(({ from, ...options }) =>
        patch(from).map((patch) => ({ kind: "change-from" as const, from, patch, ...options })),
      ),
    from.map((from) => ({ kind: "stop-from" as const, from })),
    patch(activeMonth).map((patch) => ({ kind: "fix-everywhere" as const, patch })),
    versionFrom.chain((versionFrom) =>
      patch(versionFrom).map((patch) => ({ kind: "edit-scheduled" as const, versionFrom, patch })),
    ),
    versionFrom.map((versionFrom) => ({ kind: "cancel-scheduled" as const, versionFrom })),
  );
};

const scenario = fc
  .record({ state, activeMonth: month })
  .chain(({ state, activeMonth }) =>
    edit(activeMonth, state.item.versions).map((edit) => ({ state, activeMonth, edit })),
  );

// Edits only the closed-month invariant can reject: a version in force since a closed month without a closed
// occurrence yet (so "fix everywhere" is offered), fixed with a schedule that may reach into closed months.
const closedMonthRisk = fc
  .record({
    activeOffset: fc.integer({ min: 1, max: MONTHS - 1 }),
    startOffset: fc.integer({ min: 0, max: MONTHS - 1 }),
    anchorAfter: fc.integer({ min: 0, max: 6 }),
    intervalMonths: fc.integer({ min: 1, max: 6 }),
    amount,
    overrides: fc.uniqueArray(override, { maxLength: 6, selector: (override) => override.month }),
  })
  .chain(({ activeOffset, startOffset, anchorAfter, intervalMonths, amount, overrides }) => {
    const activeMonth = addMonths(FIRST_MONTH, activeOffset);
    const effectiveFrom = addMonths(FIRST_MONTH, startOffset % activeOffset);
    const schedule = {
      kind: "recurring" as const,
      intervalMonths,
      anchor: addMonths(activeMonth, anchorAfter),
    };
    const state: RuleEditState = {
      item: { id: "item", itemType: "expense", versions: [{ effectiveFrom, amount, schedule }] },
      overrides,
    };
    return patch(effectiveFrom).map((patch) => ({
      state,
      activeMonth,
      edit: { kind: "fix-everywhere" as const, patch },
    }));
  });

/** What the user sees for the item in `month`: the effective amount and day, or nothing. */
const shown = ({ item, overrides }: RuleEditState, month: YearMonth) =>
  resolveVersionedOccurrences([item], overrides, month).occurrences.map(({ amount, day }) => [
    amount,
    day,
  ]);

const isBefore = (month: YearMonth, other: YearMonth) => monthsBetween(month, other) > 0;

describe("planRuleEdit (properties)", () => {
  it("leaves every closed month unchanged after any accepted edit", () => {
    // Arrange
    const property = fc.property(
      fc.oneof(scenario, closedMonthRisk),
      ({ state, activeMonth, edit }) => {
        // Act
        const result = planRuleEdit(state, edit, { activeMonth });

        // Assert
        fc.pre(result.ok);
        if (!result.ok) return;
        const after = applyRuleEditPlan(state, result.plan);
        for (const month of ALL_MONTHS.filter((month) => isBefore(month, activeMonth))) {
          expect(shown(after, month)).toEqual(shown(state, month));
        }
      },
    );

    fc.assert(property);
  });

  it("never changes a month before M when changing the rule from month M on", () => {
    // Arrange
    const property = fc.property(
      scenario.filter(({ edit }) => edit.kind === "change-from"),
      ({ state, activeMonth, edit }) => {
        // Act
        const result = planRuleEdit(state, edit, { activeMonth });

        // Assert
        fc.pre(result.ok && edit.kind === "change-from");
        if (!result.ok || edit.kind !== "change-from") return;
        const after = applyRuleEditPlan(state, result.plan);
        for (const month of ALL_MONTHS.filter((month) => isBefore(month, edit.from))) {
          expect(shown(after, month)).toEqual(shown(state, month));
        }
      },
    );

    fc.assert(property);
  });

  it("leaves no override behind in an open month that the new rule no longer schedules", () => {
    // Arrange
    const isScheduled = ({ item }: RuleEditState, month: YearMonth) => {
      const version = versionInForce(item.versions, month);
      return version !== undefined && isActiveInMonth(version.schedule, month);
    };
    const property = fc.property(scenario, ({ state, activeMonth, edit }) => {
      // Act
      const result = planRuleEdit(state, edit, { activeMonth });

      // Assert
      fc.pre(result.ok);
      if (!result.ok) return;
      const after = applyRuleEditPlan(state, result.plan);
      for (const { month } of after.overrides) {
        if (!isBefore(month, activeMonth) && isScheduled(state, month)) {
          expect(isScheduled(after, month)).toBe(true);
        }
      }
    });

    fc.assert(property);
  });
});
