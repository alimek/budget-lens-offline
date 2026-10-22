import type { DatabaseFileInventory } from "./database-files";

/**
 * The file work of the development storage check (#242, #75 R6), injected so the decision below is a plain
 * function and is unit-tested; `database-files.ts` performs it on the real files of the app.
 */
export interface StorageCheckFiles {
  /** Look at the files of the app without opening or changing any of them. */
  inspect(): DatabaseFileInventory;
  /** Take one copy of the live database through the same steps a migration takes. Throws when it cannot. */
  takeCopy(): void;
  /** Delete the copy this check took, and only that copy. */
  discardOwnCopy(): void;
}

/** How the copy the check reports came to be (#242). */
export type CopyCheck =
  /** A copy the app is keeping because a migration failed: reported, and left exactly where it is. */
  | "kept"
  /** A copy this check took to show what this build writes, and deleted again. */
  | "own"
  /** Nothing to copy: there is no live SQLite file. */
  | "absent"
  /** A copy was attempted and the file refused it. */
  | "failed";

export interface StorageCheckReport {
  readonly inventory: DatabaseFileInventory;
  readonly copy: CopyCheck;
}

/**
 * What the development storage check does about the pre-migration copy (#242, #75 R6):
 *
 * - A copy the app is keeping after a failed update is the older state and the more valuable one: it is reported
 *   and left alone, never replaced and never deleted (#75 R1).
 * - With no live SQLite file there is nothing to copy, and opening a database would create an empty one: the
 *   files are only reported (#242).
 * - Otherwise one copy is taken for real, through the same steps a migration takes, reported, and deleted again,
 *   so a launch finds exactly what it would have found without the check.
 *
 * The only copy this ever removes is the one the check took itself; a failed copy is reported, not thrown.
 */
export function runStorageCheck(files: StorageCheckFiles): StorageCheckReport {
  const found = files.inspect();
  if (found.copy !== "missing") {
    return { inventory: found, copy: "kept" };
  }
  if (found.database !== "sqlite") {
    return { inventory: found, copy: "absent" };
  }
  try {
    files.takeCopy();
    return { inventory: files.inspect(), copy: "own" };
  } catch {
    // The file looked copyable and was not: say so, and show what is on disk after the attempt.
    return { inventory: files.inspect(), copy: "failed" };
  } finally {
    files.discardOwnCopy();
  }
}
