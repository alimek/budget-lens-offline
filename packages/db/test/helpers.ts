import { toMinorUnits, toYearMonth } from "@budget-lens/core";
import { drizzle, type SQLJsDatabase } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import type { schema } from "../src";

const SQL = await initSqlJs();

/**
 * A fresh in-memory database. Tests use sql.js (plain SQLite in WebAssembly); the app uses expo-sqlite with
 * SQLCipher. The schema SQL is the same, and nothing here depends on file access or SQLCipher-only features.
 */
export function openTestDatabase(): SQLJsDatabase {
  return drizzle(new SQL.Database());
}

const at = new Date(Date.UTC(2026, 9, 1));

export const item = (id: string): typeof schema.items.$inferInsert => ({
  id,
  kind: "expense",
  name: "Rent",
  currency: "PLN",
  createdAt: at,
  updatedAt: at,
});

export const ruleVersion = (
  id: string,
  itemId: string,
  effectiveFrom: string,
): typeof schema.itemRuleVersions.$inferInsert => ({
  id,
  itemId,
  effectiveFrom: toYearMonth(effectiveFrom),
  amountMinor: toMinorUnits(250_000),
  intervalMonths: 1,
  anchorMonth: toYearMonth("2026-10"),
  createdAt: at,
});

export const activeMonth = (month: string): typeof schema.months.$inferInsert => ({
  month: toYearMonth(month),
  status: "active",
  openingBalanceMinor: toMinorUnits(100_000),
  closingBalanceMinor: toMinorUnits(100_000),
  totalIncomeMinor: toMinorUnits(0),
  totalExpensesMinor: toMinorUnits(0),
  netChangeMinor: toMinorUnits(0),
  createdAt: at,
  updatedAt: at,
});

export const settingsRow = (id: number): typeof schema.settings.$inferInsert => ({
  id,
  language: "system",
  baseCurrency: "PLN",
  trackedCurrencies: ["EUR"],
  lowBalanceThresholdMinor: toMinorUnits(500_000),
  largeExpenseThresholdMinor: toMinorUnits(1_000_000),
  forecastHorizonMonths: 13,
  rateMaxAgeBusinessDays: 2,
  updatedAt: at,
});

/** The SQLite error message of a failing statement (Drizzle wraps driver errors in `cause`). */
export function sqliteError(statement: () => unknown): string {
  try {
    statement();
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
    return cause instanceof Error ? cause.message : String(cause);
  }
  return "no error";
}
