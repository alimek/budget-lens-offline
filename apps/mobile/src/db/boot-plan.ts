/**
 * The files a launch finds in the database directory, as booleans: this module decides what to do about them
 * without touching the filesystem, which is what makes the decision testable (#75 R1, R2).
 */
export interface BootFiles {
  /** The live `budget-lens.db`. */
  readonly database: boolean;
  /** The encrypted copy kept from before a migration. */
  readonly copy: boolean;
  /** The temporary file of a restore that was interrupted midway. */
  readonly restoring: boolean;
  /** A database a previous "start over" kept. */
  readonly orphan: boolean;
  /** A usable key in SecureStore. */
  readonly key: boolean;
}

/**
 * `finish_restore`: a copy or an interrupted restore is the only record of the budget left; complete the restore
 * with the key that is already stored (#75 R1).
 * `open_database`: the normal case, keyed and migrated.
 * `fresh_database`: first launch, or a reinstall that left only a Keychain item behind (#34 §1).
 * `protect_existing_files`: the live file is gone and something that belongs to it is still here. Making a new
 * budget would overwrite the key those files need, so nothing is generated and the user sees the recovery screen
 * instead (#75 R2).
 */
export type BootPlan =
  | "finish_restore"
  | "open_database"
  | "fresh_database"
  | "protect_existing_files";

/**
 * Whether this launch may write a key at all: only when no file of a budget is left on the device (#75 R2). A key
 * that may belong to one of them is never overwritten, because that file would become unreadable for good; E8
 * (#96/#97) is meant to read such files again.
 */
export function mayWriteKey(files: BootFiles): boolean {
  return !(files.database || files.copy || files.restoring || files.orphan);
}

/** What the files on disk mean for this launch. Only `fresh_database` may write a key or create a file. */
export function planBoot(files: BootFiles): BootPlan {
  if (!files.database && (files.copy || files.restoring)) {
    return "finish_restore";
  }
  if (files.database) {
    return "open_database";
  }
  if (files.key && !mayWriteKey(files)) {
    return "protect_existing_files";
  }
  return "fresh_database";
}
