import { describe, expect, it } from "vitest";
import {
  applyRuleEditPlan,
  type OccurrenceOverride,
  planRuleEdit,
  type RecurringSchedule,
  type RuleEdit,
  type RuleEditState,
  type RuleVersion,
  resolveVersionedOccurrences,
  type Schedule,
  toMinorUnits,
  toYearMonth,
  type VersionedItem,
  validateRuleVersions,
} from "./index";

const ym = toYearMonth;

const monthly = (anchor: string, extra: Partial<RecurringSchedule> = {}): Schedule => ({
  kind: "recurring",
  intervalMonths: 1,
  anchor: ym(anchor),
  ...extra,
});

const version = (effectiveFrom: string, amount: number, schedule: Schedule): RuleVersion => ({
  effectiveFrom: ym(effectiveFrom),
  amount: toMinorUnits(amount),
  schedule,
});

const rent = (...versions: RuleVersion[]): VersionedItem => ({
  id: "rent",
  itemType: "expense",
  versions,
});

const override = (month: string, fields: Partial<OccurrenceOverride>): OccurrenceOverride => ({
  id: `o-${month}`,
  itemType: "expense",
  itemId: "rent",
  month: ym(month),
  ...fields,
});

/** The item's effective amount per month (`null` without an occurrence). */
const amounts = (state: RuleEditState, months: readonly string[]) =>
  months.map(
    (month) =>
      resolveVersionedOccurrences([state.item], state.overrides, ym(month)).occurrences[0]
        ?.amount ?? null,
  );

/** Plans the edit with the given active month and applies the plan; throws on a rejected edit. */
function applied(state: RuleEditState, edit: RuleEdit, activeMonth: string): RuleEditState {
  const result = planRuleEdit(state, edit, { activeMonth: ym(activeMonth) });
  if (!result.ok) throw new Error(`Rejected: ${result.error.code}`);
  return applyRuleEditPlan(state, result.plan);
}

// Rent of 2 500 zł monthly since January 2026; January to March are closed, April is active (#40, §2).
const ACTIVE = "2026-04";
const rentState: RuleEditState = {
  item: rent(version("2026-01", 250_000, monthly("2026-01"))),
  overrides: [],
};
const FIRST_HALF = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];

// A stored version as it may come from a corrupt database or a JSON backup.
const STORED = { effectiveFrom: "2026-01", amount: 250_000, schedule: monthly("2026-01") };

describe("validateRuleVersions", () => {
  it.each<[string, unknown, string[]]>([
    ["no array", null, ["invalid-versions"]],
    ["a string", "2026-01", ["invalid-versions"]],
    ["a null version", [null], ["invalid-versions"]],
    ["no versions", [], ["no-versions"]],
    ["an empty version", [{}], ["invalid-effective-from", "invalid-amount", "invalid-schedule"]],
    ["an invalid month", [{ ...STORED, effectiveFrom: "2026-13" }], ["invalid-effective-from"]],
    ["a negative amount", [{ ...STORED, amount: -5_000 }], ["invalid-amount"]],
    ["a fractional amount", [{ ...STORED, amount: 1.5 }], ["invalid-amount"]],
    ["a null schedule", [{ ...STORED, schedule: null }], ["invalid-schedule"]],
    ["a duplicate month", [STORED, { ...STORED, amount: 1 }], ["duplicate-effective-from"]],
  ])("reports %s as codes without throwing", (_case, value, expected) => {
    // Arrange
    const stored = JSON.parse(JSON.stringify(value));

    // Act
    const errors = validateRuleVersions(stored);

    // Assert
    expect(errors).toEqual(expected);
  });

  it("rejects an edit of an item whose stored versions are invalid", () => {
    // Arrange
    const state: RuleEditState = {
      item: rent(...JSON.parse(JSON.stringify([STORED, { ...STORED, amount: -5_000 }]))),
      overrides: [],
    };
    const edit: RuleEdit = {
      kind: "change-from",
      from: ym("2026-05"),
      patch: { amount: toMinorUnits(270_000) },
    };

    // Act
    const result = planRuleEdit(state, edit, { activeMonth: ym("2026-04") });

    // Assert
    expect(result).toEqual({
      ok: false,
      error: { code: "invalid-item", errors: ["invalid-amount", "duplicate-effective-from"] },
    });
  });
});

describe("resolveVersionedOccurrences", () => {
  it.each([
    ["2026-10", null],
    ["2026-11", 250_000],
    ["2026-12", 250_000],
    ["2027-01", 270_000],
    ["2027-02", 270_000],
  ])("uses the version in force in %s across the year rollover", (month, expected) => {
    // Arrange
    const item = rent(
      version("2026-11", 250_000, monthly("2026-11")),
      version("2027-01", 270_000, monthly("2026-11")),
    );

    // Act
    const resolved = resolveVersionedOccurrences([item], [], ym(month));

    // Assert
    expect(resolved.occurrences[0]?.amount ?? null).toBe(expected);
  });

  it("ends occurrences at the end month of a version until the next version starts", () => {
    // Arrange
    const state: RuleEditState = {
      item: rent(
        version("2026-01", 250_000, monthly("2026-01", { endMonth: ym("2026-02") })),
        version("2026-05", 260_000, monthly("2026-05")),
      ),
      overrides: [],
    };

    // Act
    const result = amounts(state, ["2026-02", "2026-03", "2026-04", "2026-05"]);

    // Assert
    expect(result).toEqual([250_000, null, null, 260_000]);
  });

  it("keeps the every-N-months rhythm of an anchor before the version start", () => {
    // Arrange: quarterly since February, a new amount from July (#40, §1).
    const quarterly = monthly("2026-02", { intervalMonths: 3 });
    const state: RuleEditState = {
      item: rent(version("2026-02", 10_000, quarterly), version("2026-07", 12_000, quarterly)),
      overrides: [],
    };

    // Act
    const result = amounts(state, ["2026-05", "2026-07", "2026-08", "2026-11"]);

    // Assert
    expect(result).toEqual([10_000, null, 12_000, 12_000]);
  });

  it("clamps the 31st of a version to the last day of February", () => {
    // Arrange
    const item = rent(
      version("2026-01", 250_000, monthly("2026-01")),
      version("2027-02", 270_000, monthly("2027-02", { dayOfMonth: 31 })),
    );

    // Act
    const days = ["2027-02", "2028-02"].map(
      (month) => resolveVersionedOccurrences([item], [], ym(month)).occurrences[0]?.day,
    );

    // Assert
    expect(days).toEqual([28, 29]);
  });

  it("leaves out and reports an item with invalid versions instead of failing the month", () => {
    // Arrange
    const corrupt: VersionedItem = JSON.parse(
      JSON.stringify({ id: "gym", itemType: "expense", versions: [{ ...STORED, schedule: null }] }),
    );
    const valid = rent(version("2026-01", 250_000, monthly("2026-01")));

    // Act
    const { occurrences, invalidItems } = resolveVersionedOccurrences(
      [valid, corrupt],
      [],
      ym("2026-04"),
    );

    // Assert
    expect(occurrences.map(({ item, amount }) => [item.id, amount])).toEqual([["rent", 250_000]]);
    expect(invalidItems).toEqual([corrupt]);
  });

  it("applies an override by month whichever version is in force", () => {
    // Arrange
    const state: RuleEditState = {
      item: rentState.item,
      overrides: [override("2026-07", { amount: toMinorUnits(180_000) })],
    };

    // Act
    const after = applied(
      state,
      { kind: "change-from", from: ym("2026-05"), patch: { amount: toMinorUnits(280_000) } },
      ACTIVE,
    );

    // Assert
    expect(amounts(after, ["2026-06", "2026-07"])).toEqual([280_000, 180_000]);
  });
});

describe("planRuleEdit", () => {
  it("changes the amount from the active month on and keeps the closed months", () => {
    // Arrange
    const edit: RuleEdit = {
      kind: "change-from",
      from: ym(ACTIVE),
      patch: { amount: toMinorUnits(270_000) },
    };

    // Act
    const result = planRuleEdit(rentState, edit, { activeMonth: ym(ACTIVE) });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.upsertVersions).toEqual([version(ACTIVE, 270_000, monthly("2026-01"))]);
    expect(result.plan.deleteVersions).toEqual([]);
    expect(amounts(applyRuleEditPlan(rentState, result.plan), FIRST_HALF)).toEqual([
      250_000, 250_000, 250_000, 270_000, 270_000, 270_000, 270_000,
    ]);
  });

  it.each<[string, RuleEdit, unknown]>([
    [
      "a change from a closed month",
      { kind: "change-from", from: ym("2026-03"), patch: { amount: toMinorUnits(270_000) } },
      { code: "month-closed", month: "2026-03" },
    ],
    [
      "a fix everywhere of a version used by a closed month",
      { kind: "fix-everywhere", patch: { amount: toMinorUnits(260_000) } },
      { code: "version-used-by-closed-month", month: "2026-01" },
    ],
    [
      "an override in a closed month",
      { kind: "only-month", override: override("2026-02", { skipped: true }) },
      { code: "month-closed", month: "2026-02" },
    ],
    [
      "an amount that is not whole grosze",
      { kind: "change-from", from: ym("2026-05"), patch: { amount: 270_000.5 as never } },
      { code: "invalid-rule", errors: ["invalid-amount"] },
    ],
    [
      "a change of a version that is already in force",
      { kind: "cancel-scheduled", versionFrom: ym("2026-01") },
      { code: "version-not-scheduled", month: "2026-01" },
    ],
  ])("rejects %s", (_case, edit, expected) => {
    // Act
    const result = planRuleEdit(rentState, edit, { activeMonth: ym(ACTIVE) });

    // Assert
    expect(result).toEqual({ ok: false, error: expected });
  });

  it("rejects a new item that starts before the active month", () => {
    // Arrange
    const empty: RuleEditState = { item: rent(), overrides: [] };
    const edit: RuleEdit = {
      kind: "create",
      version: version("2026-03", 5_000, monthly("2026-03")),
    };

    // Act
    const result = planRuleEdit(empty, edit, { activeMonth: ym(ACTIVE) });

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "month-closed", month: "2026-03" } });
  });

  it("rejects a fix everywhere that would add occurrences to closed months", () => {
    // Arrange: quarterly from May, so no closed month has an occurrence yet.
    const state: RuleEditState = {
      item: rent(version("2026-02", 10_000, monthly("2026-05", { intervalMonths: 3 }))),
      overrides: [],
    };
    const edit: RuleEdit = { kind: "fix-everywhere", patch: { schedule: monthly("2026-02") } };

    // Act
    const result = planRuleEdit(state, edit, { activeMonth: ym(ACTIVE) });

    // Assert
    expect(result).toEqual({
      ok: false,
      error: { code: "closed-month-changed", month: "2026-02" },
    });
  });

  it("keeps a later scheduled change and reports it", () => {
    // Arrange
    const state = applied(
      rentState,
      { kind: "change-from", from: ym("2026-07"), patch: { amount: toMinorUnits(300_000) } },
      ACTIVE,
    );
    const edit: RuleEdit = {
      kind: "change-from",
      from: ym("2026-05"),
      patch: { amount: toMinorUnits(280_000) },
    };

    // Act
    const result = planRuleEdit(state, edit, { activeMonth: ym(ACTIVE) });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.notices).toEqual([{ code: "scheduled-change-kept", month: "2026-07" }]);
    expect(amounts(applyRuleEditPlan(state, result.plan), FIRST_HALF)).toEqual([
      250_000, 250_000, 250_000, 250_000, 280_000, 280_000, 300_000,
    ]);
  });

  it("replaces a later scheduled change on request", () => {
    // Arrange
    const state = applied(
      rentState,
      { kind: "change-from", from: ym("2026-07"), patch: { amount: toMinorUnits(300_000) } },
      ACTIVE,
    );
    const edit: RuleEdit = {
      kind: "change-from",
      from: ym("2026-05"),
      patch: { amount: toMinorUnits(280_000) },
      replaceScheduled: true,
    };

    // Act
    const result = planRuleEdit(state, edit, { activeMonth: ym(ACTIVE) });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.deleteVersions).toEqual(["2026-07"]);
    expect(result.plan.notices).toEqual([{ code: "scheduled-change-replaced", month: "2026-07" }]);
  });

  it("stops from a month by ending the version in force and deleting later versions", () => {
    // Arrange
    const state = applied(
      rentState,
      { kind: "change-from", from: ym("2026-07"), patch: { amount: toMinorUnits(300_000) } },
      ACTIVE,
    );

    // Act
    const result = planRuleEdit(
      state,
      { kind: "stop-from", from: ym("2026-06") },
      { activeMonth: ym(ACTIVE) },
    );

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.upsertVersions).toEqual([
      version("2026-01", 250_000, monthly("2026-01", { endMonth: ym("2026-05") })),
    ]);
    expect(result.plan.deleteVersions).toEqual(["2026-07"]);
    expect(amounts(applyRuleEditPlan(state, result.plan), FIRST_HALF)).toEqual([
      250_000,
      250_000,
      250_000,
      250_000,
      250_000,
      null,
      null,
    ]);
  });

  it("stops before a version that has no occurrence yet by deleting it and ending the one before", () => {
    // Arrange: quarterly from August, in force from May, so May to July have no occurrence.
    const state: RuleEditState = {
      item: rent(
        version("2026-01", 250_000, monthly("2026-01")),
        version("2026-05", 90_000, monthly("2026-08", { intervalMonths: 3 })),
      ),
      overrides: [],
    };

    // Act
    const result = planRuleEdit(
      state,
      { kind: "stop-from", from: ym("2026-07") },
      { activeMonth: ym(ACTIVE) },
    );

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.upsertVersions).toEqual([
      version("2026-01", 250_000, monthly("2026-01", { endMonth: ym("2026-04") })),
    ]);
    expect(result.plan.deleteVersions).toEqual(["2026-05"]);
  });

  it("lists orphaned overrides for deletion and keeps the ones that still apply", () => {
    // Arrange: every 2 months from May; June is no longer scheduled, July still is.
    const june = override("2026-06", { skipped: true });
    const july = override("2026-07", { amount: toMinorUnits(200_000) });
    const state: RuleEditState = { item: rentState.item, overrides: [june, july] };
    const edit: RuleEdit = {
      kind: "change-from",
      from: ym("2026-05"),
      patch: { amount: toMinorUnits(270_000), schedule: monthly("2026-05", { intervalMonths: 2 }) },
    };

    // Act
    const result = planRuleEdit(state, edit, { activeMonth: ym(ACTIVE) });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.orphanedOverrides).toEqual([june]);
    expect(result.plan.keptOverrides).toEqual([july]);
    expect(result.plan.resetOverrides).toEqual([]);
  });

  it("resets kept overrides on request", () => {
    // Arrange
    const july = override("2026-07", { amount: toMinorUnits(200_000) });
    const state: RuleEditState = { item: rentState.item, overrides: [july] };
    const edit: RuleEdit = {
      kind: "change-from",
      from: ym("2026-05"),
      patch: { amount: toMinorUnits(270_000) },
      resetKeptOverrides: true,
    };

    // Act
    const result = planRuleEdit(state, edit, { activeMonth: ym(ACTIVE) });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.keptOverrides).toEqual([]);
    expect(result.plan.resetOverrides).toEqual([july]);
    expect(amounts(applyRuleEditPlan(state, result.plan), ["2026-07"])).toEqual([270_000]);
  });

  it("rejects an edit that would make a closed month's skip apply again", () => {
    // Arrange: quarterly from May, so no closed month uses the version, but a stray skip is stored for March.
    const state: RuleEditState = {
      item: rent(version("2026-02", 10_000, monthly("2026-05", { intervalMonths: 3 }))),
      overrides: [override("2026-03", { skipped: true })],
    };
    const edit: RuleEdit = {
      kind: "fix-everywhere",
      patch: { schedule: monthly("2026-03", { intervalMonths: 3 }) },
    };

    // Act
    const result = planRuleEdit(state, edit, { activeMonth: ym(ACTIVE) });

    // Assert
    expect(result).toEqual({
      ok: false,
      error: { code: "closed-month-changed", month: "2026-03" },
    });
  });

  it("fixes a new item everywhere while no closed month uses it", () => {
    // Arrange
    const state: RuleEditState = {
      item: rent(version(ACTIVE, 250_000, monthly(ACTIVE))),
      overrides: [],
    };

    // Act
    const result = planRuleEdit(
      state,
      { kind: "fix-everywhere", patch: { amount: toMinorUnits(205_000) } },
      { activeMonth: ym(ACTIVE) },
    );

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.upsertVersions).toEqual([version(ACTIVE, 205_000, monthly(ACTIVE))]);
  });
});
