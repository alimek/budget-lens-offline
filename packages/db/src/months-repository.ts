// The months repository (#112): the one fact a screen needs from `months` before month closing (#85) exists –
// which month is currently active. What a month row *is* stays in the schema's CHECKs; nothing here computes a
// balance or closes anything.
import type { YearMonth } from "@budget-lens/core";
import { eq } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

/**
 * A synchronous Drizzle SQLite database with schema v1: expo-sqlite in the app, sql.js in tests.
 */
// biome-ignore lint/suspicious/noExplicitAny: accepts databases with any schema and run-result type.
type Database = BaseSQLiteDatabase<"sync", any, any>;

/** The table `readActiveMonth` reads. A live hook re-runs it when this table changes (#35 §4). */
export const MONTH_TABLES = ["months"] as const;

/**
 * The `month` of the single `status = 'active'` row (the partial unique index keeps it to one), or `undefined`
 * while no month has been opened: onboarding (#111) creates the first one, so a database written before that has
 * none and the app falls back to the device's calendar month.
 */
export function readActiveMonth(db: Database): YearMonth | undefined {
  const row = db
    .select({ month: schema.months.month })
    .from(schema.months)
    .where(eq(schema.months.status, "active"))
    .get();
  return row?.month;
}
