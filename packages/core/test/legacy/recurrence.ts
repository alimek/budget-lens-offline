/**
 * LEGACY REFERENCE – verbatim port of apps/web/src/lib/utils/expense-filter.ts from the old
 * Budget Lens repository (comments translated to English). Do not "fix" this file: it documents
 * how the old app behaves. `month` is 0-11, `startMonth` and `targetMonth` use 1-12.
 */
import type { LegacyExpense, LegacyIncome } from "./types";

// Quarterly months: January (0), April (3), July (6), October (9)
const QUARTERLY_MONTHS = [0, 3, 6, 9];

export function isExpenseActiveInMonth(
  expense: LegacyExpense,
  month: number,
  year: number,
): boolean {
  // One-time expenses – check targetMonth
  if (expense.type === "one-time") {
    const targetMonth = expense.targetMonth;
    if (!targetMonth) return false;
    const [targetYear, targetMonthNum] = targetMonth.split("-").map(Number);
    return targetYear === year && targetMonthNum === month + 1;
  }

  switch (expense.frequency) {
    case "monthly":
      return true;

    case "quarterly":
      return QUARTERLY_MONTHS.includes(month);

    case "yearly": {
      // startMonth is 1-12, converted to 0-11; defaults to January when not set
      const startMonth = expense.startMonth !== undefined ? expense.startMonth - 1 : 0;
      return month === startMonth;
    }

    default:
      return true;
  }
}

export function getExpensesForMonth(
  expenses: LegacyExpense[],
  month: number,
  year: number,
): LegacyExpense[] {
  return expenses.filter((expense) => isExpenseActiveInMonth(expense, month, year));
}

export function isIncomeActiveInMonth(income: LegacyIncome, month: number, year: number): boolean {
  if (income.type === "one-time") {
    const targetMonth = income.targetMonth;
    if (!targetMonth) return false;
    const [targetYear, targetMonthNum] = targetMonth.split("-").map(Number);
    return targetYear === year && targetMonthNum === month + 1;
  }

  // Recurring incomes are always active (monthly)
  return true;
}

export function getIncomesForMonth(
  incomes: LegacyIncome[],
  month: number,
  year: number,
): LegacyIncome[] {
  return incomes.filter((income) => isIncomeActiveInMonth(income, month, year));
}

export function calculateMonthlyExpenses(
  expenses: LegacyExpense[],
  month: number,
  year: number,
): number {
  return getExpensesForMonth(expenses, month, year).reduce((sum, e) => sum + e.amount, 0);
}

export function calculateMonthlyIncomes(
  incomes: LegacyIncome[],
  month: number,
  year: number,
): number {
  return getIncomesForMonth(incomes, month, year).reduce((sum, i) => sum + i.amount, 0);
}
