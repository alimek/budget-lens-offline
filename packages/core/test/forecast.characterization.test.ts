/**
 * Characterization tests for the legacy forecast (use-forecast.ts).
 * The clock is frozen to Sunday 2026-10-18 12:00 in Europe/Warsaw unless a test says otherwise.
 */
import { describe, expect, it } from "vitest";
import { byId, expenses, incomes } from "./fixtures";
import { freezeClockAt, useFrozenClock } from "./helpers";
import { legacyForecast } from "./legacy/forecast";
import type { LegacyExpense } from "./legacy/types";

useFrozenClock("2026-10-18T10:00:00.000Z", "Europe/Warsaw");

function oneTimeExpense(amount: number, targetMonth: string): LegacyExpense {
  return { id: `one-time-${targetMonth}`, name: "One-off", amount, type: "one-time", targetMonth };
}

describe("legacyForecast – balance", () => {
  it("covers 13 months from the current month, across the year boundary", () => {
    // Arrange: no items needed.

    // Act
    const { forecast } = legacyForecast([], [], 0, 0);

    // Assert
    expect(forecast).toHaveLength(13);
    expect([forecast[0]?.year, forecast[0]?.monthIndex]).toEqual([2026, 9]);
    expect([forecast[3]?.year, forecast[3]?.monthIndex]).toEqual([2027, 0]);
    expect([forecast[12]?.year, forecast[12]?.monthIndex]).toEqual([2027, 9]);
  });

  it("carries each ending balance into the next month and adds savings as totalFunds", () => {
    // Arrange
    const currentBalance = 10000;
    const totalSavings = 25000;

    // Act
    const { forecast } = legacyForecast(expenses, incomes, currentBalance, totalSavings);

    // Assert
    let previousBalance = currentBalance;
    for (const month of forecast) {
      expect(month.netChange).toBe(month.income - month.expenses);
      expect(month.balance).toBe(previousBalance + month.netChange);
      expect(month.totalFunds).toBe(month.balance + totalSavings);
      previousBalance = month.balance;
    }
  });

  it("matches the golden master for the fixture budget", () => {
    // Arrange: fixture budget with every item shape, an expense and an income override.

    // Act
    const result = legacyForecast(expenses, incomes, 10000, 25000);

    // Assert
    expect(result).toMatchSnapshot();
  });

  it("starts in the device's local month, not the UTC month", () => {
    // LEGACY: the forecast reads `new Date()` in the device time zone – changed by #6.
    // Arrange: 2026-10-31T23:30Z is already 1 November in Warsaw.
    const instant = "2026-10-31T23:30:00.000Z";

    // Act
    freezeClockAt(instant, "Europe/Warsaw");
    const warsawStart = legacyForecast([], [], 0, 0).forecast[0]?.monthIndex;
    freezeClockAt(instant, "UTC");
    const utcStart = legacyForecast([], [], 0, 0).forecast[0]?.monthIndex;

    // Assert
    expect(warsawStart).toBe(10);
    expect(utcStart).toBe(9);
  });
});

describe("legacyForecast – name-based overrides", () => {
  it("replaces a recurring expense by its override in the override month only", () => {
    // Ported by #5: occurrence overrides keyed by item id (src/occurrence-overrides.ts); no legacy import.
    // Arrange: "Rent (nadpisanie)" 3200 replaces Rent 3000 in November 2026.

    // Act
    const [october, november, december] = legacyForecast(expenses, [], 0, 0).forecast;

    // Assert
    expect(october?.expenses).toBe(3529.99); // Rent + Internet + Gym + quarterly Software
    expect(november?.expenses).toBe(3429.99); // override 3200 instead of Rent 3000
    expect(december?.expenses).toBe(3229.99); // back to Rent 3000
  });

  it("replaces every recurring item that shares the overridden name", () => {
    // Ported by #5: overrides match by item id, so same-name items are independent.
    // Arrange
    const items: LegacyExpense[] = [
      { id: "a", name: "Rent", amount: 3000, type: "recurring", frequency: "monthly" },
      { id: "b", name: "Rent", amount: 500, type: "recurring", frequency: "monthly" },
      byId(expenses, "exp-rent-override"),
    ];

    // Act
    const november = legacyForecast(items, [], 0, 0).forecast[1];

    // Assert
    expect(november?.expenses).toBe(3200);
  });

  it("double-counts once the recurring item is renamed", () => {
    // Ported by #5: overrides match by item id, so renaming keeps them.
    // Arrange
    const items: LegacyExpense[] = [
      { ...byId(expenses, "exp-rent"), name: "Flat rent" },
      byId(expenses, "exp-rent-override"),
    ];

    // Act
    const november = legacyForecast(items, [], 0, 0).forecast[1];

    // Assert
    expect(november?.expenses).toBe(6200);
  });
});

describe("legacyForecast – payment statuses", () => {
  it("counts only unpaid expenses and unreceived incomes, in the current month only", () => {
    // Arrange
    const options = {
      currentMonthKey: "2026-10",
      expenseStatuses: new Map([["exp-rent", true]]),
      incomeStatuses: new Map([["inc-salary", true]]),
    };

    // Act
    const { forecast } = legacyForecast(expenses, incomes, 0, 0, options);

    // Assert
    expect(forecast[0]?.expenses).toBe(529.99); // 3529.99 without the paid Rent
    expect(forecast[0]?.income).toBe(250); // 9250 without the received Salary
    expect(forecast[2]?.expenses).toBe(3229.99); // December: statuses ignored
    expect(forecast[2]?.income).toBe(14250);
  });
});

describe("legacyForecast – warnings", () => {
  it("warns about a low balance only strictly between 0 and 5000", () => {
    // LEGACY: balance 0 gives no warning, threshold 5000 is hard-coded – changed by #6 and #7.
    // Arrange
    const balances = [0, 0.01, 4999.99, 5000];

    // Act
    const firstWarnings = balances.map((b) => legacyForecast([], [], b, 0).warnings[0]);

    // Assert
    expect(firstWarnings.map((w) => w?.type)).toEqual([undefined, "caution", "caution", undefined]);
    // LEGACY: Polish message with toLocaleString() without a locale – changed by #2 and #6.
    expect(firstWarnings[2]?.message).toBe(
      `Za 1 mies. niskie saldo: ${(4999.99).toLocaleString()} PLN`,
    );
  });

  it("raises a critical warning for every month with a negative balance", () => {
    // Arrange
    const balance = -0.01;

    // Act
    const { warnings } = legacyForecast([], [], balance, 0);

    // Assert
    expect(warnings).toHaveLength(13);
    expect(warnings.every((w) => w.type === "critical")).toBe(true);
  });

  it("flags a large expense only when netChange is below -10000", () => {
    // LEGACY: threshold -10000 is hard-coded – changed by #7.
    // Arrange
    const atThreshold = [oneTimeExpense(10000, "2026-10")];
    const belowThreshold = [oneTimeExpense(10000.01, "2026-10")];

    // Act
    const atThresholdWarnings = legacyForecast(atThreshold, [], 100000, 0).warnings;
    const belowThresholdWarnings = legacyForecast(belowThreshold, [], 100000, 0).warnings;

    // Assert
    expect(atThresholdWarnings).toEqual([]);
    expect(belowThresholdWarnings.map((w) => w.id)).toEqual(["info-0"]);
  });
});
