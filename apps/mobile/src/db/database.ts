import {
  type BudgetDatabase,
  MigrationRestoreError,
  runMigrationsWithSafetyCopy,
} from "@budget-lens/db";
import { renameDatabaseAside } from "./database-files";
import { moveDatabaseKeyAside } from "./db-key";
import { type OpenedDatabase, openEncryptedDatabase } from "./encrypted-database";

/**
 * The outcome of starting the database up. `ready` hands the app its migrated connection; every other kind is a
 * screen, never a crash and never a deleted file (#34 §2).
 *
 * `migration_failed` means the encrypted copy was put back, so the file on disk is the version from before the
 * update (#35 Q3). `restore_failed` means the migration failed and the copy could not be put back either, so the
 * copy is still being kept and the screen must not claim anything was restored (#75 R1).
 * `storage_unreachable` is SecureStore or the filesystem refusing to answer, which must not be read as "there is
 * no data" and offers no destructive action.
 */
export type DatabaseBoot =
  | { readonly kind: "ready"; readonly db: BudgetDatabase }
  | { readonly kind: "encryption_unavailable" }
  | { readonly kind: "key_missing" }
  | { readonly kind: "state_unrecognized" }
  | { readonly kind: "migration_failed"; readonly error: unknown }
  | { readonly kind: "restore_failed"; readonly error: MigrationRestoreError }
  | { readonly kind: "storage_unreachable"; readonly error: unknown };

function migrationFailure(error: unknown): DatabaseBoot {
  return error instanceof MigrationRestoreError
    ? { kind: "restore_failed", error }
    : { kind: "migration_failed", error };
}

async function boot(): Promise<DatabaseBoot> {
  let opened: OpenedDatabase;
  try {
    opened = await openEncryptedDatabase({ changeListener: true });
  } catch (error) {
    return { kind: "storage_unreachable", error };
  }
  if (opened.kind !== "ready") {
    return opened;
  }
  try {
    runMigrationsWithSafetyCopy(opened.db, opened.safetyCopy);
    return { kind: "ready", db: opened.db };
  } catch (error) {
    // Either the copy is back in place or the file was never touched; the connection belongs to neither.
    opened.close();
    return migrationFailure(error);
  }
}

let booting: Promise<DatabaseBoot> | undefined;

/**
 * Open the encrypted database and bring the schema up to date – the same path on first launch and after an
 * upgrade. Called once per session; a result other than `ready` is not cached, so the retry on a boot screen runs
 * the whole sequence again.
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
 * "Start over" from the recovery screen: the database the app cannot open is renamed and kept on the device,
 * together with the key that may open it, and then the sequence runs again and creates a fresh one under a new
 * key. Deleting such files and restoring a backup are E8 work (#96/#97), so nothing here removes them, and the
 * kept file stays openable by that feature (#75 R2).
 */
export async function startOverAppDatabase(): Promise<DatabaseBoot> {
  booting = undefined;
  const stamp = Date.now();
  try {
    renameDatabaseAside(stamp);
    await moveDatabaseKeyAside(stamp);
  } catch (error) {
    return { kind: "storage_unreachable", error };
  }
  return bootAppDatabase();
}
