// Business rules of the occurrence override and payment status repository (#83): an override is one occurrence in
// one month in the item's own currency, an open month resolves through core, a plan writes versions and overrides
// together, and a closed month cannot be changed.
import {
  DEFAULT_SETTINGS,
  forecast,
  type ItemType,
  planRuleEdit,
  type RuleEdit,
  type RuleEditPlan,
  type RuleVersion,
  type Schedule,
  toMinorUnits,
  toYearMonth,
} from "@budget-lens/core";
import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyRulePlan,
  applyRuleVersionPlan,
  clearOverride,
  createItem,
  type ItemsRepositoryDeps,
  readItems,
  readMonthOccurrences,
  readOverrides,
  readPaymentStatuses,
  runMigrations,
  schema,
  setOverride,
  settleOccurrence,
  unsettleOccurrence,
} from "../src";
import { activeMonth, openTestDatabase } from "./helpers";

const ym = toYearMonth;
const minor = toMinorUnits;

/** The active month comes from the caller (#112 reads it from the `months` table); no clock is read here. */
const context = { activeMonth: ym("2026-10") };

const monthly = (anchor: string, endMonth?: string): Schedule => ({
  kind: "recurring",
  intervalMonths: 1,
  anchor: ym(anchor),
  ...(endMonth === undefined ? {} : { endMonth: ym(endMonth) }),
});

let db: ReturnType<typeof openTestDatabase>;
let deps: ItemsRepositoryDeps;
let clock: number;
let nextId: number;

beforeEach(() => {
  db = openTestDatabase();
  runMigrations(db);
  clock = Date.UTC(2026, 9, 21);
  nextId = 0;
  deps = {
    now: () => clock,
    newId: () => {
      nextId += 1;
      return `row-${nextId}`;
    },
  };
});

/** An item with one version from 2026-01 (monthly unless another schedule is given), written by #81. */
function seedItem(
  id: string,
  amountMinor: number,
  options: { readonly currency?: "PLN" | "JPY"; readonly schedule?: Schedule } = {},
) {
  createItem(
    db,
    {
      id,
      kind: "expense",
      name: id,
      currency: options.currency ?? "PLN",
      versions: [
        {
          effectiveFrom: ym("2026-01"),
          amount: minor(amountMinor),
          schedule: options.schedule ?? monthly("2026-01"),
        },
      ],
    },
    deps,
  );
}

/** The state core's `planRuleEdit` plans from: exactly what the repository reads. */
function stateOf(itemId: string) {
  const stored = readItems(db).items.find((entry) => entry.id === itemId);
  if (stored === undefined) throw new Error(`no item ${itemId}`);
  return { item: stored, overrides: readOverrides(db).overrides };
}

function planOf(edit: RuleEdit, itemId = "rent"): RuleEditPlan {
  const result = planRuleEdit(stateOf(itemId), edit, context);
  if (!result.ok) throw new Error(`plan rejected: ${result.error.code}`);
  return result.plan;
}

const overrideRows = () => db.select().from(schema.occurrenceOverrides).all();
const paymentRows = () => db.select().from(schema.paymentStatuses).all();
const versionsOf = (itemId: string) =>
  readItems(db).items.find((entry) => entry.id === itemId)?.versions;
/** Labels of rows in a fixed order, so no test depends on the order SQLite returns them in. */
const labels = <T>(rows: readonly T[], label: (row: T) => string): string[] =>
  rows.map(label).sort();

describe("overrides", () => {
  it("keeps one override per occurrence, with the amount of the last edit", () => {
    // Arrange
    seedItem("rent", 250_000);
    const month = ym("2026-10");

    // Act
    expect(
      setOverride(db, { itemId: "rent", month, amount: minor(320_000) }, context, deps),
    ).toEqual({ ok: true });
    const first = overrideRows()[0];
    clock += 60_000;
    setOverride(db, { itemId: "rent", month, amount: minor(210_000) }, context, deps);

    // Assert
    expect(overrideRows()).toEqual([
      {
        id: first?.id,
        itemId: "rent",
        month,
        amountMinor: 210_000,
        skipped: false,
        note: null,
        createdAt: new Date(Date.UTC(2026, 9, 21)),
        updatedAt: new Date(Date.UTC(2026, 9, 21, 0, 1)),
      },
    ]);
    expect(readOverrides(db).overrides).toEqual([
      { id: first?.id, itemType: "expense", itemId: "rent", month, amount: 210_000 },
    ]);
  });

  it("stores and resolves an override in the item's own currency, without converting it", () => {
    // Arrange
    seedItem("rent", 250_000);
    seedItem("manga", 12_000, { currency: "JPY" });
    const month = ym("2026-10");

    // Act
    setOverride(db, { itemId: "rent", month, amount: minor(320_000) }, context, deps);
    setOverride(db, { itemId: "manga", month, amount: minor(12_000) }, context, deps);

    // Assert: 3 200,00 zł stays 320000 grosze and ¥12,000 (exponent 0) stays 12000, each in its own currency.
    expect(labels(overrideRows(), (row) => `${row.itemId}:${row.amountMinor}`)).toEqual([
      "manga:12000",
      "rent:320000",
    ]);
    const { occurrences, rejectedOverrides } = readMonthOccurrences(db, month);
    expect(rejectedOverrides).toEqual([]);
    expect(labels(occurrences, (row) => `${row.item.id}:${row.amount}:${row.currency}`)).toEqual([
      "manga:12000:JPY",
      "rent:320000:PLN",
    ]);
  });

  it("refuses an override of a one-time item", () => {
    // Arrange
    seedItem("tv", 250_000, { schedule: { kind: "one-time", month: ym("2026-10") } });

    // Act
    const result = setOverride(
      db,
      { itemId: "tv", month: ym("2026-10"), amount: minor(10_000) },
      context,
      deps,
    );

    // Assert
    expect(result).toEqual({
      ok: false,
      error: { code: "invalid-override", errors: ["one-time-item"] },
    });
    expect(overrideRows()).toEqual([]);
  });

  it("refuses an override of a month the item has no occurrence in", () => {
    // Arrange: every third month from 2026-01 schedules 2026-10, but not 2026-11.
    seedItem("quarterly", 250_000, {
      schedule: { kind: "recurring", intervalMonths: 3, anchor: ym("2026-01") },
    });

    // Act
    const result = setOverride(
      db,
      { itemId: "quarterly", month: ym("2026-11"), amount: minor(10_000) },
      context,
      deps,
    );

    // Assert
    expect(result).toEqual({
      ok: false,
      error: { code: "invalid-override", errors: ["inactive-month"] },
    });
    expect(overrideRows()).toEqual([]);
  });

  it("reports damaged override rows instead of dropping or throwing them", () => {
    // Arrange: one good row, one amount no integer can hold, and one whose item is gone.
    seedItem("rent", 250_000);
    setOverride(db, { itemId: "rent", month: ym("2026-10"), skipped: true }, context, deps);
    db.run(
      sql`INSERT INTO occurrence_overrides (id, item_id, month, amount_minor, skipped, created_at, updated_at)
        VALUES ('huge', 'rent', '2026-11', 9223372036854775807, 0, 1, 1)`,
    );
    db.run(sql`PRAGMA foreign_keys=OFF`);
    db.run(
      sql`INSERT INTO occurrence_overrides (id, item_id, month, amount_minor, skipped, created_at, updated_at)
        VALUES ('gone', 'missing-item', '2026-12', 100, 0, 1, 1)`,
    );

    // Act
    const { overrides, rejectedOverrides } = readOverrides(db);

    // Assert
    expect(overrides).toEqual([
      { id: "row-2", itemType: "expense", itemId: "rent", month: ym("2026-10"), skipped: true },
    ]);
    expect(
      labels(rejectedOverrides, (row) => `${(row.override as { id: string }).id}:${row.errors}`),
    ).toEqual(["gone:unknown-item", "huge:invalid-amount"]);
  });
});

describe("payment status", () => {
  it("settles an occurrence once and keeps the first settled_at", () => {
    // Arrange
    seedItem("rent", 250_000);
    const month = ym("2026-10");

    // Act
    settleOccurrence(db, "rent", month, context, deps);
    clock += 60_000;
    settleOccurrence(db, "rent", month, context, deps);

    // Assert
    expect(paymentRows()).toEqual([{ itemId: "rent", month, settledAt: new Date(clock - 60_000) }]);
    expect(readPaymentStatuses(db, { months: [month] })).toEqual([
      { itemType: "expense", itemId: "rent", month, settled: true },
    ]);
  });

  it("unsets a settlement, and an unsettled month is simply absent", () => {
    // Arrange
    seedItem("rent", 250_000);
    const month = ym("2026-10");
    settleOccurrence(db, "rent", month, context, deps);

    // Act
    expect(unsettleOccurrence(db, "rent", month, context)).toEqual({ ok: true });
    unsettleOccurrence(db, "rent", month, context);

    // Assert
    expect(paymentRows()).toEqual([]);
    expect(readPaymentStatuses(db)).toEqual([]);
  });
});

describe("month read", () => {
  it("hides a skipped occurrence and keeps its payment row", () => {
    // Arrange
    seedItem("rent", 250_000);
    const month = ym("2026-10");
    settleOccurrence(db, "rent", month, context, deps);
    setOverride(db, { itemId: "rent", month, skipped: true }, context, deps);

    // Act
    const read = readMonthOccurrences(db, month);

    // Assert: nothing to show, and the row that says it was paid is still there (#5).
    expect(read.occurrences).toEqual([]);
    expect(read.rejectedOverrides).toEqual([]);
    expect(read.invalidItems).toEqual([]);
    expect(readPaymentStatuses(db, { months: [month] })).toEqual([
      { itemType: "expense", itemId: "rent", month, settled: true },
    ]);
  });

  it("brings a skipped occurrence back with its settlement when the skip is cleared", () => {
    // Arrange
    seedItem("rent", 250_000);
    const month = ym("2026-10");
    settleOccurrence(db, "rent", month, context, deps);
    setOverride(db, { itemId: "rent", month, skipped: true }, context, deps);

    // Act
    expect(clearOverride(db, "rent", month, context)).toEqual({ ok: true });

    // Assert
    const { occurrences } = readMonthOccurrences(db, month);
    expect(occurrences).toHaveLength(1);
    expect(occurrences[0]).toMatchObject({ amount: 250_000, currency: "PLN", settled: true });
    expect(occurrences[0]?.override).toBeUndefined();
  });

  it("keeps overrides keyed by month across a rule-version change and a year rollover", () => {
    // Arrange: 250,00 from 2026-01, an override in 2026-12, and a new rule from 2027-01.
    seedItem("rent", 250_000);
    setOverride(
      db,
      { itemId: "rent", month: ym("2026-12"), amount: minor(100_000) },
      context,
      deps,
    );
    const version: RuleVersion = {
      effectiveFrom: ym("2027-01"),
      amount: minor(300_000),
      schedule: monthly("2026-01"),
    };

    // Act
    expect(
      applyRuleVersionPlan(db, "rent", { upsertVersions: [version], deleteVersions: [] }, deps),
    ).toEqual({ ok: true });

    // Assert: December keeps its own amount, January uses the new rule, the override is untouched.
    expect(readMonthOccurrences(db, ym("2026-12")).occurrences[0]).toMatchObject({
      amount: 100_000,
      currency: "PLN",
    });
    expect(readMonthOccurrences(db, ym("2027-01")).occurrences[0]).toMatchObject({
      amount: 300_000,
      currency: "PLN",
    });
    expect(
      readOverrides(db).overrides.map((override) => [override.month, override.amount]),
    ).toEqual([["2026-12", 100_000]]);
  });
});

describe("rule edit plans", () => {
  it("deletes the overrides a plan orphans in the transaction that writes its versions", () => {
    // Arrange: overrides in 2026-11 and 2027-03; from 2026-11 the item ends with 2026-12.
    seedItem("rent", 250_000);
    setOverride(
      db,
      { itemId: "rent", month: ym("2026-11"), amount: minor(100_000) },
      context,
      deps,
    );
    setOverride(
      db,
      { itemId: "rent", month: ym("2027-03"), amount: minor(200_000) },
      context,
      deps,
    );
    const plan = planOf({
      kind: "change-from",
      from: ym("2026-11"),
      patch: { schedule: monthly("2026-01", "2026-12") },
    });

    // Act
    expect(applyRulePlan(db, "rent", plan, context, deps)).toEqual({ ok: true });

    // Assert: the version is written and the orphaned override of 2027-03 went with it (#40 Q4).
    expect(plan.orphanedOverrides.map((override) => override.month)).toEqual(["2027-03"]);
    expect(versionsOf("rent")).toEqual([
      { effectiveFrom: ym("2026-01"), amount: 250_000, schedule: monthly("2026-01") },
      { effectiveFrom: ym("2026-11"), amount: 250_000, schedule: monthly("2026-01", "2026-12") },
    ]);
    expect(readOverrides(db).overrides.map((override) => override.month)).toEqual(["2026-11"]);
  });

  it("keeps an override whose month the plan keeps scheduling", () => {
    // Arrange
    seedItem("rent", 250_000);
    setOverride(
      db,
      { itemId: "rent", month: ym("2026-12"), amount: minor(100_000) },
      context,
      deps,
    );
    const plan = planOf({
      kind: "change-from",
      from: ym("2026-11"),
      patch: { amount: minor(300_000) },
    });

    // Act
    expect(applyRulePlan(db, "rent", plan, context, deps)).toEqual({ ok: true });

    // Assert: the later month keeps its own amount (#40 Q5).
    expect(plan.keptOverrides.map((override) => override.month)).toEqual(["2026-12"]);
    expect(readOverrides(db).overrides.map((override) => override.amount)).toEqual([100_000]);
    expect(readMonthOccurrences(db, ym("2026-12")).occurrences[0]).toMatchObject({
      amount: 100_000,
    });
  });

  it("deletes the kept overrides of a plan that resets them", () => {
    // Arrange
    seedItem("rent", 250_000);
    setOverride(
      db,
      { itemId: "rent", month: ym("2026-12"), amount: minor(100_000) },
      context,
      deps,
    );
    const plan = planOf({
      kind: "change-from",
      from: ym("2026-11"),
      patch: { amount: minor(300_000) },
      resetKeptOverrides: true,
    });

    // Act
    expect(applyRulePlan(db, "rent", plan, context, deps)).toEqual({ ok: true });

    // Assert
    expect(plan.resetOverrides).toHaveLength(1);
    expect(overrideRows()).toEqual([]);
    expect(readMonthOccurrences(db, ym("2026-12")).occurrences[0]).toMatchObject({
      amount: 300_000,
    });
  });

  it("writes neither versions nor overrides when it refuses a plan", () => {
    // Arrange: a plan whose override is an amount and a skip at once, which core rejects.
    seedItem("rent", 250_000);
    const plan: RuleEditPlan = {
      upsertVersions: [
        { effectiveFrom: ym("2026-11"), amount: minor(300_000), schedule: monthly("2026-01") },
      ],
      deleteVersions: [],
      upsertOverrides: [
        {
          id: "row-9",
          itemType: "expense",
          itemId: "rent",
          month: ym("2026-11"),
          amount: minor(100_000),
          skipped: true,
        },
      ],
      orphanedOverrides: [],
      keptOverrides: [],
      resetOverrides: [],
      notices: [],
    };

    // Act
    const result = applyRulePlan(db, "rent", plan, context, deps);

    // Assert
    expect(result).toEqual({
      ok: false,
      error: { code: "invalid-override", errors: ["skipped-with-amount"] },
    });
    expect(versionsOf("rent")).toHaveLength(1);
    expect(overrideRows()).toEqual([]);
  });
});

describe("closed months", () => {
  it("refuses every override and payment write of a month before the active month", () => {
    // Arrange
    seedItem("rent", 250_000);
    const closed = ym("2026-09");

    // Act
    const writes = [
      setOverride(db, { itemId: "rent", month: closed, amount: minor(10_000) }, context, deps),
      clearOverride(db, "rent", closed, context),
      settleOccurrence(db, "rent", closed, context, deps),
      unsettleOccurrence(db, "rent", closed, context),
    ];

    // Assert
    for (const write of writes) {
      expect(write).toEqual({ ok: false, error: { code: "month-closed", month: closed } });
    }
    expect(overrideRows()).toEqual([]);
    expect(paymentRows()).toEqual([]);
  });

  it("refuses a write for a month whose row is closed", () => {
    // Arrange: the caller's active month is stale: the `months` row of 2026-10 is already closed.
    seedItem("rent", 250_000);
    db.insert(schema.months)
      .values({
        ...activeMonth("2026-10"),
        status: "closed",
        closedAt: new Date(clock),
        baseCurrency: "PLN",
      })
      .run();

    // Act
    const result = settleOccurrence(db, "rent", ym("2026-10"), context, deps);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "month-closed", month: ym("2026-10") } });
    expect(paymentRows()).toEqual([]);
  });

  it("refuses a plan whose overrides include a closed month", () => {
    // Arrange: an override of 2026-09 that a plan would delete.
    seedItem("rent", 250_000);
    const orphan = {
      id: "row-9",
      itemType: "expense" as ItemType,
      itemId: "rent",
      month: ym("2026-09"),
      amount: minor(10_000),
    };
    db.insert(schema.occurrenceOverrides)
      .values({
        id: orphan.id,
        itemId: orphan.itemId,
        month: orphan.month,
        amountMinor: orphan.amount,
        skipped: false,
        note: null,
        createdAt: new Date(clock),
        updatedAt: new Date(clock),
      })
      .run();

    // Act
    const result = applyRulePlan(
      db,
      "rent",
      {
        upsertVersions: [],
        deleteVersions: [],
        upsertOverrides: [],
        orphanedOverrides: [orphan],
        keptOverrides: [],
        resetOverrides: [],
        notices: [],
      },
      context,
      deps,
    );

    // Assert: the closed override is untouched.
    expect(result).toEqual({ ok: false, error: { code: "month-closed", month: ym("2026-09") } });
    expect(overrideRows()).toHaveLength(1);
  });
});

describe("forecast", () => {
  it("uses the overrides and payment statuses the repository reads", () => {
    // Arrange: 250,00 monthly; the active month is paid, the next one is overridden to 200,00.
    seedItem("rent", 250_000);
    settleOccurrence(db, "rent", ym("2026-10"), context, deps);
    setOverride(
      db,
      { itemId: "rent", month: ym("2026-11"), amount: minor(200_000) },
      context,
      deps,
    );

    // Act
    const result = forecast({
      items: readItems(db).items,
      overrides: readOverrides(db).overrides,
      paymentStatuses: readPaymentStatuses(db),
      currentBalance: minor(0),
      totalSavings: minor(0),
      fromMonth: ym("2026-10"),
      months: 2,
      settings: DEFAULT_SETTINGS,
      rates: [],
    });

    // Assert
    if (!result.ok) throw new Error(`forecast failed: ${result.error.code}`);
    expect(result.forecast.map((row) => row.expenses)).toEqual([0, 200_000]);
    expect(result.rejectedOverrides).toEqual([]);
  });
});
