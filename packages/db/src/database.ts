// The driver entry only: `drizzle-orm/expo-sqlite` also re-exports `useLiveQuery`, which imports React.
import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite/driver";
import type { SQLiteDatabase } from "expo-sqlite";
import * as schema from "./schema";

export type BudgetDatabase = ExpoSQLiteDatabase<typeof schema>;

/**
 * Wraps an opened expo-sqlite connection in Drizzle with schema v1. The caller opens and keys the connection
 * and then migrates the result before any other query (#75).
 */
export function createDatabase(client: SQLiteDatabase): BudgetDatabase {
  return drizzle(client, { schema });
}
