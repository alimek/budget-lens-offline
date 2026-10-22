import { toMinorUnits, toYearMonth } from "@budget-lens/core";
import { drizzle, type SQLJsDatabase } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import type { MigrationSafetyCopy, schema } from "../src";

const SQL = await initSqlJs();

/**
 * A fresh in-memory database. Tests use sql.js (plain SQLite in WebAssembly); the app uses expo-sqlite with
 * SQLCipher. The schema SQL is the same, and nothing here depends on file access or SQLCipher-only features.
 */
export function openTestDatabase(): SQLJsDatabase {
  return drizzle(new SQL.Database());
}

/**
 * The database file and the encrypted copy of it (#35 §2, #75), modelled with sql.js bytes: `create` saves them,
 * `restore` makes them the live file again, and `connect` is what a launch does – open the current file, so a test
 * sees what the launch after a restored copy sees. The app copies a file with SQLCipher
 * (`sqlcipher_export`); the bytes of an sql.js database are the same whole-file copy without the encryption,
 * which is covered on devices (#75, e2e). `calls` counts what the migration wrapper asked the copy to do.
 */
export function openTestDatabaseFile(): {
  readonly connect: () => SQLJsDatabase;
  readonly copy: MigrationSafetyCopy;
  readonly calls: { created: number; restored: number; discarded: number };
} {
  let live = new SQL.Database();
  let saved: Uint8Array | undefined;
  const calls = { created: 0, restored: 0, discarded: 0 };
  return {
    calls,
    connect: () => drizzle(live),
    copy: {
      create() {
        calls.created += 1;
        saved = live.export();
      },
      restore() {
        calls.restored += 1;
        if (saved === undefined) {
          throw new Error("There is no copy to restore");
        }
        live = new SQL.Database(saved);
      },
      discard() {
        calls.discarded += 1;
        saved = undefined;
      },
    },
  };
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
