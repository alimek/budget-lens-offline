/**
 * Import of legacy name-based overrides ("<name> (nadpisanie)") into occurrence overrides (#5), checked on the
 * legacy fixtures and against the legacy forecast totals.
 */
import { describe, expect, it } from "vitest";
import {
  type MinorUnits,
  overridesFromLegacy,
  resolveOccurrences,
  scheduleFromLegacy,
  sumMinorUnits,
  toMinorUnits,
  toYearMonth,
} from "../src/index";
import { byId, expenses, incomes } from "./fixtures";
import type { LegacyExpense, LegacyIncome } from "./legacy/types";

const START = toYearMonth("2026-01");

/** Legacy amounts are PLN floats with at most 2 decimals (DECIMAL(12,2)). */
function withMinorUnits<T extends LegacyExpense | LegacyIncome>(items: readonly T[]) {
  return items.map((item) => ({ ...item, amount: toMinorUnits(Math.round(item.amount * 100)) }));
}

function sequentialIds() {
  let next = 0;
  return () => {
    next += 1;
    return `override-${next}`;
  };
}

/** Imports legacy items of one type and returns the resolved total for a month. */
function importedTotal(
  legacyItems: readonly (LegacyExpense | LegacyIncome)[],
  itemType: "expense" | "income",
  month: string,
): MinorUnits {
  const migration = overridesFromLegacy(withMinorUnits(legacyItems), itemType, sequentialIds());
  const items = migration.items.flatMap((item) => {
    const schedule = scheduleFromLegacy(item, START);
    return schedule === null ? [] : [{ ...item, itemType, schedule }];
  });
  const occurrences = resolveOccurrences(items, migration.overrides, toYearMonth(month));
  return sumMinorUnits(occurrences.map((occurrence) => occurrence.amount));
}

describe("overridesFromLegacy", () => {
  it("turns the fixture overrides into override records of the matching items", () => {
    // Arrange
    const legacyExpenses = withMinorUnits(expenses);
    const legacyIncomes = withMinorUnits(incomes);

    // Act
    const expenseMigration = overridesFromLegacy(legacyExpenses, "expense", sequentialIds());
    const incomeMigration = overridesFromLegacy(legacyIncomes, "income", sequentialIds());

    // Assert
    expect(expenseMigration.overrides).toEqual([
      {
        id: "override-1",
        itemType: "expense",
        itemId: "exp-rent",
        month: "2026-11",
        amount: 320_000,
      },
    ]);
    expect(incomeMigration.overrides).toEqual([
      {
        id: "override-1",
        itemType: "income",
        itemId: "inc-salary",
        month: "2027-01",
        amount: 950_000,
      },
    ]);
    expect(expenseMigration.items.map((item) => item.id)).not.toContain("exp-rent-override");
    expect(incomeMigration.items.map((item) => item.id)).not.toContain("inc-salary-override");
  });

  it("keeps the legacy forecast totals of the override months", () => {
    // Arrange: legacy forecast – November 2026 expenses 3429.99 (override 3200 instead of Rent 3000).

    // Act
    const novemberExpenses = importedTotal(expenses, "expense", "2026-11");
    const januaryIncomes = importedTotal(incomes, "income", "2027-01");

    // Assert
    expect(novemberExpenses).toBe(342_999);
    expect(januaryIncomes).toBe(975_000); // Salary override 9500 + Garage rental 250
  });

  it("keeps the legacy total when one override hid several same-name items", () => {
    // Arrange: legacy forecast gives 3200 for November (both "Rent" items hidden).
    const items: LegacyExpense[] = [
      { id: "a", name: "Rent", amount: 3000, type: "recurring", frequency: "monthly" },
      { id: "b", name: "Rent", amount: 500, type: "recurring", frequency: "monthly" },
      byId(expenses, "exp-rent-override"),
    ];

    // Act
    const migration = overridesFromLegacy(withMinorUnits(items), "expense", sequentialIds());
    const november = importedTotal(items, "expense", "2026-11");

    // Assert
    expect(migration.overrides).toEqual([
      { id: "override-1", itemType: "expense", itemId: "a", month: "2026-11", amount: 320_000 },
      { id: "override-2", itemType: "expense", itemId: "b", month: "2026-11", skipped: true },
    ]);
    expect(november).toBe(320_000);
  });

  it("keeps an override without a matching item as a regular one-time item, as legacy counts it", () => {
    // Arrange: the recurring item was renamed, legacy forecast gives 6200 for November.
    const items: LegacyExpense[] = [
      { ...byId(expenses, "exp-rent"), name: "Flat rent" },
      byId(expenses, "exp-rent-override"),
    ];

    // Act
    const migration = overridesFromLegacy(withMinorUnits(items), "expense", sequentialIds());
    const november = importedTotal(items, "expense", "2026-11");

    // Assert
    expect(migration.overrides).toEqual([]);
    expect(november).toBe(620_000);
  });
});
