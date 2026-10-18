/**
 * Characterization tests for the legacy recurrence rules (expense-filter.ts).
 * Month arguments are 0-11 (January = 0), as in legacy.
 */
import { describe, expect, it } from "vitest";
import { addMonths, isActiveInMonth, toYearMonth } from "../src/index";
import { byId, expenses, incomes } from "./fixtures";
import {
  calculateMonthlyExpenses,
  calculateMonthlyIncomes,
  isExpenseActiveInMonth,
  isIncomeActiveInMonth,
} from "./legacy/recurrence";
import type { LegacyExpense, LegacyIncome } from "./legacy/types";
import { legacySchedule } from "./legacy-schedule";

const ALL_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function activeMonths(expense: LegacyExpense, year: number): number[] {
  return ALL_MONTHS.filter((month) => isExpenseActiveInMonth(expense, month, year));
}

describe("isExpenseActiveInMonth", () => {
  it("treats monthly expenses and recurring expenses without a frequency as active every month", () => {
    // Arrange
    const monthly = byId(expenses, "exp-rent");
    const withoutFrequency = byId(expenses, "exp-gym");

    // Act
    const monthlyMonths = activeMonths(monthly, 2026);
    const withoutFrequencyMonths = activeMonths(withoutFrequency, 2026);

    // Assert
    expect(monthlyMonths).toEqual(ALL_MONTHS);
    expect(withoutFrequencyMonths).toEqual(ALL_MONTHS);
  });

  it("schedules quarterly expenses in January, April, July and October only", () => {
    // Ported by #4: any anchor month; legacy items map to a January/April/July/October anchor (see below).
    // Arrange
    const quarterly = byId(expenses, "exp-software");

    // Act
    const months = activeMonths(quarterly, 2026);

    // Assert
    expect(months).toEqual([0, 3, 6, 9]);
  });

  it("schedules yearly expenses in startMonth (1-12)", () => {
    // Arrange
    const yearlyInMarch = byId(expenses, "exp-car-insurance");

    // Act
    const months = activeMonths(yearlyInMarch, 2026);

    // Assert
    expect(months).toEqual([2]);
  });

  it("schedules yearly expenses without startMonth in January", () => {
    // Ported by #4: the new model always has an explicit anchor month.
    // Arrange
    const yearlyWithoutStart = byId(expenses, "exp-domain");

    // Act
    const months = activeMonths(yearlyWithoutStart, 2026);

    // Assert
    expect(months).toEqual([0]);
  });

  it("treats recurring expenses as active long before they were created", () => {
    // Ported by #4: schedules start at their anchor and may end (see "legacy → ported schedule" below).
    // Arrange
    const rent = byId(expenses, "exp-rent");

    // Act
    const activeIn1900 = isExpenseActiveInMonth(rent, 0, 1900);

    // Assert
    expect(activeIn1900).toBe(true);
  });

  it("schedules one-time expenses only in targetMonth and never without it", () => {
    // Arrange
    const vacation = byId(expenses, "exp-vacation"); // targetMonth 2027-07
    const laptop = byId(expenses, "exp-laptop"); // no targetMonth

    // Act
    const vacation2027 = activeMonths(vacation, 2027);
    const vacation2026 = activeMonths(vacation, 2026);
    const laptop2026 = activeMonths(laptop, 2026);

    // Assert
    expect(vacation2027).toEqual([6]);
    expect(vacation2026).toEqual([]);
    expect(laptop2026).toEqual([]);
  });
});

describe("isIncomeActiveInMonth", () => {
  it("treats recurring incomes as monthly and one-time incomes as active in targetMonth only", () => {
    // Ported by #4: incomes use the same schedule as expenses, with any interval.
    // Arrange
    const salary = byId(incomes, "inc-salary");
    const bonus = byId(incomes, "inc-bonus"); // targetMonth 2026-12

    // Act
    const salaryMonths = ALL_MONTHS.filter((m) => isIncomeActiveInMonth(salary, m, 2026));
    const bonusMonths = ALL_MONTHS.filter((m) => isIncomeActiveInMonth(bonus, m, 2026));

    // Assert
    expect(salaryMonths).toEqual(ALL_MONTHS);
    expect(bonusMonths).toEqual([11]);
  });
});

describe("calculateMonthlyExpenses / calculateMonthlyIncomes", () => {
  it("counts both a recurring item and its name-based override", () => {
    // Ported by #5: resolveOccurrences applies overrides wherever occurrences are listed.
    // Arrange: November 2026 has "Rent (nadpisanie)", January 2027 has "Salary (nadpisanie)".
    const november = { month: 10, year: 2026 };
    const january = { month: 0, year: 2027 };

    // Act
    const novemberExpenses = calculateMonthlyExpenses(expenses, november.month, november.year);
    const januaryIncomes = calculateMonthlyIncomes(incomes, january.month, january.year);

    // Assert
    // Rent 3000 + Internet 79.99 + Gym 150 + "Rent (nadpisanie)" 3200
    expect(novemberExpenses).toBe(6429.99);
    // Salary 9000 + Garage rental 250 + "Salary (nadpisanie)" 9500
    expect(januaryIncomes).toBe(18750);
  });

  it("sums float amounts with floating-point rounding errors", () => {
    // LEGACY: amounts are PLN floats – changed by #2 (integer grosze).
    // Arrange
    const items: LegacyExpense[] = [
      { id: "a", name: "A", amount: 0.1, type: "recurring", frequency: "monthly" },
      { id: "b", name: "B", amount: 0.2, type: "recurring", frequency: "monthly" },
    ];

    // Act
    const total = calculateMonthlyExpenses(items, 0, 2026);

    // Assert
    expect(total).toBe(0.30000000000000004);
  });
});

describe("legacy fixtures → ported schedules (#4)", () => {
  // Not a quarter month and after March, so quarterly and yearly anchors are searched forward from START.
  const START = toYearMonth("2026-05");
  const MONTHS = Array.from({ length: 24 }, (_, offset) => addMonths(START, offset)); // 2026-05 … 2028-04

  function portedActiveMonths(item: LegacyExpense | LegacyIncome): string[] {
    const schedule = legacySchedule(item, START);
    return schedule === null ? [] : MONTHS.filter((month) => isActiveInMonth(schedule, month));
  }

  /** Months in which a legacy predicate (0-11 month index) reports the item as active. */
  function legacyActiveMonths<T>(
    item: T,
    isActive: (item: T, month: number, year: number) => boolean,
  ) {
    return MONTHS.filter((month) =>
      isActive(item, Number(month.slice(5, 7)) - 1, Number(month.slice(0, 4))),
    );
  }

  it("matches the legacy months of every fixture item from the start month on", () => {
    // Arrange
    const legacy = [
      ...expenses.map((expense) => legacyActiveMonths(expense, isExpenseActiveInMonth)),
      ...incomes.map((income) => legacyActiveMonths(income, isIncomeActiveInMonth)),
    ];

    // Act
    const ported = [...expenses, ...incomes].map(portedActiveMonths);

    // Assert
    expect(ported).toEqual(legacy);
  });

  it("is not active before the start month, unlike legacy", () => {
    // Arrange
    const rent = legacySchedule(byId(expenses, "exp-rent"), START);

    // Act
    const active =
      rent === null
        ? null
        : {
            in1900: isActiveInMonth(rent, toYearMonth("1900-01")),
            inStartMonth: isActiveInMonth(rent, START),
          };

    // Assert
    expect(active).toEqual({ in1900: false, inStartMonth: true });
  });
});
