import { type BudgetDatabase, createDatabase, runMigrations } from "@budget-lens/db";
import { openDatabaseAsync } from "expo-sqlite";

const DATABASE_NAME = "budget-lens.db";

async function open(): Promise<BudgetDatabase> {
  // `enableChangeListener` feeds live reads (#35 §4).
  const client = await openDatabaseAsync(DATABASE_NAME, { enableChangeListener: true });
  // #75: the SQLCipher key (`PRAGMA key`) and the cipher guard go here, before the first query.
  const db = createDatabase(client);
  runMigrations(db);
  return db;
}

let opening: Promise<BudgetDatabase> | undefined;

/**
 * The app database with its schema migrated to the latest version (first launch and upgrades alike). Opened once
 * per app session; later calls share the same connection, which has foreign keys enforced.
 */
export function openAppDatabase(): Promise<BudgetDatabase> {
  opening ??= open();
  return opening;
}
