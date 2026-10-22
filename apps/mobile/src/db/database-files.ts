import type { MigrationSafetyCopy } from "@budget-lens/db";
import { Directory, File, FileMode } from "expo-file-system";
import {
  backupDatabaseSync,
  defaultDatabaseDirectory,
  openDatabaseSync,
  type SQLiteDatabase,
} from "expo-sqlite";
import {
  asideNames,
  COPY_NAME,
  DATABASE_NAME,
  fileNamesOf,
  isBudgetFile,
  RESTORE_NAME,
} from "./database-names";
import { runStorageCheck, type StorageCheckReport } from "./storage-check";

// expo-sqlite reports its database directory as a plain path; expo-file-system addresses files by URI, and a
// bare path is not one (#34 §7). Without the scheme, `exists` throws instead of answering.
const databaseDirectory = `file://${String(defaultDatabaseDirectory).replace(/^file:\/\//, "")}`;

/** The 16 bytes every unencrypted SQLite database starts with. */
const SQLITE_HEADER = "SQLite format 3\0";

/** The header of a database file, as far as it exists. */
const HEADER_LENGTH = 16;

function fileNamed(name: string): File {
  return new File(databaseDirectory, name);
}

/** Delete a database and every side file of it: a database is never alone on disk (#75 R5). */
function remove(name: string): void {
  for (const fileName of fileNamesOf(name)) {
    const file = fileNamed(fileName);
    if (file.exists) {
      file.delete();
    }
  }
}

/** The files this launch finds: the live database, the copy, and an interrupted restore. */
function presentDatabaseFiles(): {
  readonly database: boolean;
  readonly copy: boolean;
  readonly restoring: boolean;
} {
  return {
    database: fileNamed(DATABASE_NAME).exists,
    copy: fileNamed(COPY_NAME).exists,
    restoring: fileNamed(RESTORE_NAME).exists,
  };
}

/** A `close` that can be called by everyone who needs the connection gone: the recovery paths close it from
 * different places, and a second `closeSync` would throw. */
export function closeOnce(client: SQLiteDatabase): () => void {
  let closed = false;
  return () => {
    if (closed) {
      return;
    }
    closed = true;
    client.closeSync();
  };
}

/** What a file in the database directory is: a SQLite database, something this app did not write as one, or
 * nothing at all. */
export type FileFormat = "sqlite" | "foreign" | "missing";

/**
 * Whether a file is a plain SQLite database, decided by its first 16 bytes. A file that is not one is a leftover
 * of an older, encrypted build (#242) or of a damaged database: the app never opens such a file, and the
 * development storage check only reports on it.
 */
function fileFormat(name: string): FileFormat {
  const file = fileNamed(name);
  if (!file.exists) {
    return "missing";
  }
  let header: Uint8Array;
  const handle = file.open(FileMode.ReadOnly);
  try {
    header = handle.readBytesSync(HEADER_LENGTH);
  } finally {
    handle.close();
  }
  const seen = String.fromCharCode(...Array.from(header.slice(0, HEADER_LENGTH)));
  return seen === SQLITE_HEADER ? "sqlite" : "foreign";
}

/**
 * Every file the app keeps besides the live database – the copy, an interrupted restore and what a "start over"
 * renamed aside, each with its side files – with its format, for the development storage check (#75 R6).
 * Nothing here opens or changes them.
 */
function keptDatabaseFiles(): { readonly name: string; readonly format: FileFormat }[] {
  const directory = new Directory(databaseDirectory);
  if (!directory.exists) {
    return [];
  }
  const live = new Set(fileNamesOf(DATABASE_NAME));
  return directory
    .list()
    .filter((entry) => !live.has(entry.name) && isBudgetFile(entry.name))
    .map((entry) => ({ name: entry.name, format: fileFormat(entry.name) }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

/** What the files of this app look like on the device, for the development storage check (#75 R6). */
export interface DatabaseFileInventory {
  readonly database: FileFormat;
  readonly copy: FileFormat;
  /** The files a failed update left behind and what a "start over" renamed aside. */
  readonly kept: { readonly name: string; readonly format: FileFormat }[];
}

/**
 * Look at the files of the app without opening or changing any of them (#242, #75 R6): the live database and the
 * copy beside it, and every file the app is keeping. A release build never calls this.
 */
function inspectDatabaseFiles(): DatabaseFileInventory {
  return {
    database: fileFormat(DATABASE_NAME),
    copy: fileFormat(COPY_NAME),
    kept: keptDatabaseFiles(),
  };
}

/**
 * Move a copy into the place of the live database (#75 R1). The copy is first written to
 * `budget-lens.restoring.db` and only then moved over the live file by `rename`, which is a single filesystem
 * operation: whatever happens to the process, the live name holds either the file that was there or the whole
 * copy, never half of either. The copy itself is kept, so an interrupted restore can be finished by the next
 * launch; its side files are the only things removed, and they belong to the file being replaced, not to the
 * copy (#75 R5).
 */
function moveIntoPlace(copyName: string): void {
  const copy = fileNamed(copyName);
  if (!copy.exists) {
    throw new Error(`There is no ${copyName} to restore`);
  }
  const staging = fileNamed(RESTORE_NAME);
  if (staging.exists) {
    staging.delete();
  }
  copy.copySync(staging);
  remove(DATABASE_NAME);
  staging.rename(DATABASE_NAME);
}

/**
 * Finish a restore the previous launch began or never started (#75 R1). Called when the live file is gone but the
 * copy or an interrupted restore is still here: this is the only path that may create the live file in that
 * state, and it never replaces the copy. Does nothing when the live file is there or nothing is being kept.
 */
export function finishInterruptedRestore(): void {
  if (fileNamed(DATABASE_NAME).exists) {
    return;
  }
  const staging = fileNamed(RESTORE_NAME);
  if (staging.exists) {
    // The whole copy is already staged; only the move is missing.
    remove(DATABASE_NAME);
    staging.rename(DATABASE_NAME);
    return;
  }
  if (fileNamed(COPY_NAME).exists) {
    moveIntoPlace(COPY_NAME);
  }
}

/**
 * The pre-migration copy of #35 §2. It is written by the open connection through SQLite's own backup, so it is a
 * consistent whole-file copy of the live database rather than a file copied under a running transaction.
 *
 * `restore` closes the connection first and then puts the copy back, so nobody may query that connection
 * afterwards; the app shows the recovery screen instead.
 */
export function createSafetyCopy(options: {
  readonly client: SQLiteDatabase;
  readonly closeConnection: () => void;
}): MigrationSafetyCopy {
  const { client, closeConnection } = options;
  return {
    create() {
      // An earlier launch that failed is keeping the older state, and the older state is the more valuable one
      // (#75 R1): the copy is made only when nothing is being kept yet.
      if (fileNamed(COPY_NAME).exists) {
        return;
      }
      const copy = openDatabaseSync(COPY_NAME);
      try {
        backupDatabaseSync({ sourceDatabase: client, destDatabase: copy });
      } finally {
        copy.closeSync();
      }
    },
    restore() {
      closeConnection();
      moveIntoPlace(COPY_NAME);
    },
    discard() {
      remove(COPY_NAME);
      remove(RESTORE_NAME);
    },
  };
}

/**
 * "Start over" from the recovery screen: the database the app cannot open is renamed and kept, never deleted –
 * #34 keeps it for support and E8 (#96/#97) decides when such files go away. Side files move with the file they
 * belong to (#75 R5), so the fresh database takes names that hold nothing of the old one and the kept file can
 * still be read by E8.
 */
export function renameDatabaseAside(stamp: number): void {
  const found = presentDatabaseFiles();
  const moves = asideNames({
    stamp,
    database: found.database,
    copy: found.copy,
    restoring: found.restoring,
  });
  for (const move of moves) {
    const file = fileNamed(move.from);
    if (file.exists) {
      file.rename(move.to);
    }
  }
}

/**
 * Development only (#242, #75 R6): leave the database on the device unreadable, so the next cold start runs the
 * real recovery screen over a real file. The database that was there is renamed and kept, exactly as "start over"
 * keeps it, and the bytes written under its name are not a database. A release build refuses to do anything.
 */
export function damageDatabaseFile(stamp: number): boolean {
  if (!__DEV__) {
    return false;
  }
  if (!fileNamed(DATABASE_NAME).exists) {
    return false;
  }
  renameDatabaseAside(stamp);
  const damaged = fileNamed(DATABASE_NAME);
  damaged.create();
  damaged.writeSync("this is not a budget: written by a development build (#242)");
  return true;
}

/**
 * Development only (#242, #75 R6): run the storage check of #75 R6 on the real files of the app. What it decides
 * about a copy is `runStorageCheck`, unit-tested; this is the part that touches the filesystem, and it is the
 * only place that knows which copy belongs to the check itself: an earlier launch's copy, or a restore under way,
 * is never removed here (#75 R1). A release build never calls this.
 */
export function checkDatabaseFiles(): StorageCheckReport {
  let takenByThisCheck = false;
  return runStorageCheck({
    inspect: inspectDatabaseFiles,
    takeCopy() {
      // Only reached when the live file really is a SQLite database: `openDatabaseSync` creates a file when the
      // name holds none, and an empty database is not something a check should leave behind (#242). A second,
      // plain connection: the live one belongs to `DatabaseGate` and this must not disturb it.
      const client = openDatabaseSync(DATABASE_NAME);
      const close = closeOnce(client);
      // From here on a copy appears, this check made it, and it is this check's to remove again.
      takenByThisCheck = true;
      try {
        createSafetyCopy({ client, closeConnection: close }).create();
      } finally {
        close();
      }
    },
    discardOwnCopy() {
      if (takenByThisCheck) {
        remove(COPY_NAME);
      }
    },
  });
}
