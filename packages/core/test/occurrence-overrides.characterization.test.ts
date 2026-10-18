/**
 * Compares the legacy name-based overrides ("<name> (nadpisanie)" one-time items) with the ported id-based
 * occurrence overrides (#5) on the fixture budget. There is no legacy data import: the test writes the equivalent
 * override records by hand. The clock is frozen to Sunday 2026-10-18 12:00 in Europe/Warsaw.
 */
import { describe, expect, it } from "vitest";
import {
  addMonths,
  type ItemType,
  type OccurrenceOverride,
  resolveOccurrences,
  type ScheduledItem,
  sumMinorUnits,
  toMinorUnits,
  toYearMonth,
} from "../src/index";
import { expenses, incomes } from "./fixtures";
import { useFrozenClock } from "./helpers";
import { legacyForecast } from "./legacy/forecast";
import type { LegacyExpense, LegacyIncome } from "./legacy/types";
import { legacySchedule } from "./legacy-schedule";

useFrozenClock("2026-10-18T10:00:00.000Z", "Europe/Warsaw");

const START = toYearMonth("2026-10");

/** The fixture items without the legacy override items, with amounts in minor units. */
function portedItems(
  items: readonly (LegacyExpense | LegacyIncome)[],
  itemType: ItemType,
): ScheduledItem[] {
  return items
    .filter((item) => !item.id.endsWith("-override"))
    .flatMap((item) => {
      const schedule = legacySchedule(item, START);
      const amount = toMinorUnits(Math.round(item.amount * 100));
      return schedule === null ? [] : [{ id: item.id, itemType, amount, schedule }];
    });
}

/** The fixture overrides "Rent (nadpisanie)" 3200 in 2026-11 and "Salary (nadpisanie)" 9500 in 2027-01, by id. */
const overrides: OccurrenceOverride[] = [
  {
    id: "o1",
    itemType: "expense",
    itemId: "exp-rent",
    month: toYearMonth("2026-11"),
    amount: toMinorUnits(320_000),
  },
  {
    id: "o2",
    itemType: "income",
    itemId: "inc-salary",
    month: toYearMonth("2027-01"),
    amount: toMinorUnits(950_000),
  },
];

describe("occurrence overrides – legacy monthly totals", () => {
  it("gives the legacy forecast totals in every forecast month with id-based overrides", () => {
    // Arrange
    const items = [...portedItems(expenses, "expense"), ...portedItems(incomes, "income")];
    const totalOf = (itemType: ItemType, monthIndex: number) => {
      const { occurrences } = resolveOccurrences(items, overrides, addMonths(START, monthIndex));
      const amounts = occurrences
        .filter(({ item }) => item.itemType === itemType)
        .map(({ amount }) => amount);
      return sumMinorUnits(amounts);
    };

    // Act
    const legacy = legacyForecast(expenses, incomes, 0, 0).forecast.map((month) => [
      Math.round(month.expenses * 100),
      Math.round(month.income * 100),
    ]);
    const ported = legacy.map((_, index) => [totalOf("expense", index), totalOf("income", index)]);

    // Assert
    expect(legacy).toHaveLength(13);
    expect(ported).toEqual(legacy);
  });
});
