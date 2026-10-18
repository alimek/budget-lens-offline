/**
 * LEGACY REFERENCE – port of `useForecast` from apps/web/src/lib/hooks/use-forecast.ts in the old
 * Budget Lens repository, without React ("use client" removed; the hook body never used React APIs).
 * Comments are translated to English. Polish strings (the " (nadpisanie)" override suffix and the
 * warning messages) are legacy user-facing data and are kept verbatim.
 * Do not "fix" this file: it documents how the old app behaves. It reads the clock via `new Date()`,
 * so tests must freeze time with `vi.setSystemTime`.
 */
import { monthNames } from "./format";
import { getExpensesForMonth, getIncomesForMonth } from "./recurrence";
import type { LegacyExpense, LegacyIncome } from "./types";

export interface ForecastMonth {
  month: string;
  monthIndex: number;
  year: number;
  balance: number;
  income: number;
  expenses: number;
  netChange: number;
  totalFunds: number;
}

export interface Warning {
  id: string;
  type: "critical" | "caution" | "info";
  message: string;
  month: string;
}

export interface PaymentStatusOptions {
  expenseStatuses?: Map<string, boolean>;
  incomeStatuses?: Map<string, boolean>;
  currentMonthKey?: string;
}

export function legacyForecast(
  expenses: LegacyExpense[],
  incomes: LegacyIncome[],
  currentBalance: number,
  totalSavings: number,
  paymentOptions?: PaymentStatusOptions,
): { forecast: ForecastMonth[]; warnings: Warning[] } {
  const forecast = (() => {
    const result: ForecastMonth[] = [];
    const today = new Date();
    // The current month starts with the current balance
    let startingBalance = currentBalance;

    // 13 months: current month + 12 future months
    for (let i = 0; i < 13; i++) {
      const forecastDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const month = forecastDate.getMonth(); // 0-indexed
      const year = forecastDate.getFullYear();
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

      const allMonthExpenses = getExpensesForMonth(expenses, month, year);
      const allMonthIncomes = getIncomesForMonth(incomes, month, year);

      // Drop recurring items that have an override in this month (matched by name)
      const monthExpenses = (() => {
        const overrides = allMonthExpenses.filter(
          (e) =>
            e.type === "one-time" && e.name.includes("(nadpisanie)") && e.targetMonth === monthKey,
        );
        const overriddenNames = new Set(overrides.map((o) => o.name.replace(" (nadpisanie)", "")));
        return allMonthExpenses.filter((e) => {
          if (e.type === "recurring") {
            return !overriddenNames.has(e.name);
          }
          return true;
        });
      })();

      const monthIncomes = (() => {
        const overrides = allMonthIncomes.filter(
          (i) =>
            i.type === "one-time" && i.name.includes("(nadpisanie)") && i.targetMonth === monthKey,
        );
        const overriddenNames = new Set(overrides.map((o) => o.name.replace(" (nadpisanie)", "")));
        return allMonthIncomes.filter((i) => {
          if (i.type === "recurring") {
            return !overriddenNames.has(i.name);
          }
          return true;
        });
      })();

      let monthlyIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
      let monthlyExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      if (i === 0 && paymentOptions?.currentMonthKey === monthKey) {
        const { expenseStatuses, incomeStatuses } = paymentOptions;

        // Only count remaining (unpaid) expenses and unreceived income
        if (expenseStatuses) {
          monthlyExpenses = monthExpenses
            .filter((e) => !expenseStatuses.get(e.id))
            .reduce((sum, e) => sum + e.amount, 0);
        }
        if (incomeStatuses) {
          monthlyIncome = monthIncomes
            .filter((i) => !incomeStatuses.get(i.id))
            .reduce((sum, i) => sum + i.amount, 0);
        }
      }

      const netChange = monthlyIncome - monthlyExpenses;
      const endingBalance = startingBalance + netChange;

      result.push({
        month: `${(monthNames[month] ?? "Sty").substring(0, 3)} ${year}`,
        monthIndex: month,
        year,
        balance: endingBalance,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        netChange,
        totalFunds: endingBalance + totalSavings,
      });

      startingBalance = endingBalance;
    }

    return result;
  })();

  const warnings = (() => {
    const result: Warning[] = [];

    forecast.forEach((month, index) => {
      // Critical: negative balance
      if (month.balance < 0) {
        result.push({
          id: `critical-${index}`,
          type: "critical",
          message: `Za ${index + 1} mies. saldo ujemne: ${month.balance.toLocaleString()} PLN`,
          month: month.month,
        });
      }
      // Caution: low balance
      else if (month.balance < 5000 && month.balance > 0) {
        result.push({
          id: `caution-${index}`,
          type: "caution",
          message: `Za ${index + 1} mies. niskie saldo: ${month.balance.toLocaleString()} PLN`,
          month: month.month,
        });
      }
      // Info: large expense
      if (month.netChange < -10000) {
        result.push({
          id: `info-${index}`,
          type: "info",
          message: `${month.month}: duży wydatek ${Math.abs(month.netChange).toLocaleString()} PLN`,
          month: month.month,
        });
      }
    });

    return result;
  })();

  return { forecast, warnings };
}
