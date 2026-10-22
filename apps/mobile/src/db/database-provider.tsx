// The opened database as app state (#112): `DatabaseGate` owns the connection – it opens, keys and migrates it –
// and hands it to the screens through this provider, so a screen reads through a repository instead of booting a
// database of its own. Before the gate is ready there is no database to read, and nothing under it renders.
import type { BudgetDatabase } from "@budget-lens/db";
import { createContext, type PropsWithChildren, use } from "react";

const DatabaseContext = createContext<BudgetDatabase | null>(null);

/** Makes the migrated database available to `useDatabase()`. */
export function DatabaseProvider({
  db,
  children,
}: PropsWithChildren<{ readonly db: BudgetDatabase }>) {
  return <DatabaseContext value={db}>{children}</DatabaseContext>;
}

/**
 * The app's database. It throws rather than returning `undefined` because the only thing above it is
 * `DatabaseGate`, which renders its children only once the connection is open and migrated.
 */
export function useDatabase(): BudgetDatabase {
  const db = use(DatabaseContext);
  if (db === null) {
    throw new Error("DatabaseProvider is missing");
  }
  return db;
}
