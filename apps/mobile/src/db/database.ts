import { type BudgetDatabase, createDatabase, runMigrationsWithSafetyCopy } from "@budget-lens/db";
import { openDatabaseAsync } from "expo-sqlite";
import {
  closeOnce,
  createSafetyCopy,
  finishInterruptedRestore,
  renameDatabaseAside,
} from "./database-files";
import { DATABASE_NAME } from "./database-names";

/**
 * The outcome of starting the database up. `ready` hands the app its migrated connection; `unavailable` is the
 * one recovery screen (#242) – never a crash and never a deleted file (#34 §2). The reason stays with the error:
 * the screen says what it can and offers a retry or "start over", so a device that is merely busy is not read as
 * "there is no data".
 */
export type DatabaseBoot =
  | { readonly kind: "ready"; readonly db: BudgetDatabase }
  | { readonly kind: "unavailable"; readonly error: unknown };

async function boot(): Promise<DatabaseBoot> {
  let close: (() => void) | undefined;
  try {
    // A copy left by a failed update is the whole budget, and the live name is empty: put it back before
    // anything is opened over it (#75 R1).
    finishInterruptedRestore();
    // `enableChangeListener` feeds live reads (#35 §4); only one connection per session may claim it.
    const client = await openDatabaseAsync(DATABASE_NAME, { enableChangeListener: true });
    close = closeOnce(client);
    const db = createDatabase(client);
    runMigrationsWithSafetyCopy(db, createSafetyCopy({ client, closeConnection: close }));
    return { kind: "ready", db };
  } catch (error) {
    // The copy is either back in place or the file was never touched; the connection belongs to neither. A
    // restore that failed keeps the copy where it is, so nothing here deletes anything (#75 R1).
    close?.();
    return { kind: "unavailable", error };
  }
}

let booting: Promise<DatabaseBoot> | undefined;

/**
 * Open the plain SQLite database and bring the schema up to date – the same path on first launch and after an
 * upgrade. Called once per session; `unavailable` is not cached, so the retry on the recovery screen runs the
 * whole sequence again.
 */
export function bootAppDatabase(): Promise<DatabaseBoot> {
  booting ??= boot().then((result) => {
    if (result.kind !== "ready") {
      booting = undefined;
    }
    return result;
  });
  return booting;
}

/**
 * "Start over" from the recovery screen: the database the app cannot open is renamed and kept on the device, and
 * then the sequence runs again and creates a fresh one. Deleting such files and restoring a backup are E8 work
 * (#96/#97), so nothing here removes them, and the kept file stays readable by that feature.
 */
export async function startOverAppDatabase(): Promise<DatabaseBoot> {
  booting = undefined;
  try {
    renameDatabaseAside(Date.now());
  } catch (error) {
    return { kind: "unavailable", error };
  }
  return bootAppDatabase();
}
