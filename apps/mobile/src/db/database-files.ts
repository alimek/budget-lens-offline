import type { MigrationSafetyCopy } from "@budget-lens/db";
import { Directory, File } from "expo-file-system";
import { defaultDatabaseDirectory, type SQLiteDatabase } from "expo-sqlite";
import {
  asideNames,
  COPY_NAME,
  DATABASE_NAME,
  fileNamesOf,
  isBudgetFile,
  isOrphanName,
  RESTORE_NAME,
} from "./database-names";

// expo-sqlite reports its database directory as a plain path; expo-file-system addresses files by URI, and a
// bare path is not one (#34 §7). Without the scheme, `exists` throws instead of answering.
const databaseDirectory = `file://${String(defaultDatabaseDirectory).replace(/^file:\/\//, "")}`;

/** The schema name the copy is attached under while `sqlcipher_export` writes it. */
const COPY_SCHEMA = "pre_migration";

/** The 16 bytes every unencrypted SQLite database starts with. */
const PLAINTEXT_HEADER = "SQLite format 3\0";

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

/** Quote for a SQL string literal. The path is ours, but escaping keeps the pragma and ATTACH honest anyway. */
function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** The path SQLite understands for a file in its own directory: the same file, without the URI scheme. */
function pathOf(name: string): string {
  return fileNamed(name).uri.replace(/^file:\/+/, "/");
}

/**
 * The files this launch finds, without the key (`boot-plan.ts` combines them with it). The live file, the copy
 * and the interrupted restore are checked by name; a kept file is found by listing the directory, because its
 * name carries the moment it was kept.
 */
export function presentDatabaseFiles(): {
  readonly database: boolean;
  readonly copy: boolean;
  readonly restoring: boolean;
  readonly orphan: boolean;
} {
  return {
    database: fileNamed(DATABASE_NAME).exists,
    copy: fileNamed(COPY_NAME).exists,
    restoring: fileNamed(RESTORE_NAME).exists,
    orphan: hasOrphanFile(),
  };
}

/**
 * Whether a kept database is here. Only this needs the directory listing, and a listing that cannot be read
 * counts as "no kept file": the plan then still refuses to create anything as long as a file it can name is
 * present, and a false negative can only ever lead to the recovery screen, never to a new key over a kept file.
 */
function hasOrphanFile(): boolean {
  try {
    const directory = new Directory(databaseDirectory);
    return directory.exists && directory.list().some((entry) => isOrphanName(entry.name));
  } catch {
    return false;
  }
}

/** Delete a database file expo-sqlite created but that the app must not keep (a hard stop on first launch). */
export function deleteDatabaseFile(): void {
  remove(DATABASE_NAME);
}

/**
 * A `close` that can be called by everyone who needs the connection gone: the recovery paths close it from
 * different places, and a second `closeSync` would throw.
 */
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

/** How a database file looks: ciphertext, plaintext SQLite, or no file at all. */
export type FileEncryption = "encrypted" | "plaintext" | "missing";

/** Whether a file in the database directory still starts with SQLite's plaintext header (#75 device check). */
export async function fileEncryption(name: string): Promise<FileEncryption> {
  const file = fileNamed(name);
  if (!file.exists) {
    return "missing";
  }
  const header = await file.bytes();
  const magic = String.fromCharCode(...Array.from(header.slice(0, 16)));
  return magic === PLAINTEXT_HEADER ? "plaintext" : "encrypted";
}

/**
 * Every file the app keeps besides the live database — the copy, an interrupted restore and what a "start over"
 * renamed aside, each with its side files — with its encryption state, for the development storage check
 * (#75 R6). Nothing here opens or changes them.
 */
export async function keptDatabaseFiles(): Promise<
  { readonly name: string; readonly state: FileEncryption }[]
> {
  const directory = new Directory(databaseDirectory);
  if (!directory.exists) {
    return [];
  }
  const live = new Set(fileNamesOf(DATABASE_NAME));
  const kept = directory
    .list()
    .filter((entry) => !live.has(entry.name) && isBudgetFile(entry.name));
  const states = await Promise.all(
    kept.map(async (entry) => ({
      name: entry.name,
      state: await fileEncryption(entry.name).catch(() => "missing" as const),
    })),
  );
  return states.sort((left, right) => left.name.localeCompare(right.name));
}

/** The name the pre-migration copy is kept under, for the development storage check. */
export const COPY_FILE_NAME = COPY_NAME;

/**
 * Move an encrypted copy into the place of the live database (#75 R1). The copy is first written to
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
 * Finish a restore the previous launch began or never started, with the key it already has (#75 R1). Called when
 * the live file is gone but the copy or an interrupted restore is still here: this is the only path that may
 * create the live file in that state, and it neither writes a key nor replaces the copy.
 */
export function finishRestore(): void {
  const staging = fileNamed(RESTORE_NAME);
  if (staging.exists) {
    // The whole copy is already staged; only the move is missing.
    remove(DATABASE_NAME);
    staging.rename(DATABASE_NAME);
    return;
  }
  moveIntoPlace(COPY_NAME);
}

/**
 * The encrypted copy of #35 §2. It is written by the open connection through `sqlcipher_export` into a database
 * attached with the same key, so the copy is exactly as unreadable as the live file and, unlike a plain file
 * copy, consistent.
 *
 * `restore` closes the connection first and then puts the copy back, so nobody may query that connection
 * afterwards; the app shows the recovery screen instead.
 */
export function createSafetyCopy(options: {
  readonly client: SQLiteDatabase;
  readonly key: string;
  readonly closeConnection: () => void;
}): MigrationSafetyCopy {
  const { client, key, closeConnection } = options;
  return {
    create() {
      // An earlier launch that failed is keeping the older state, and the older state is the more valuable one
      // (#75 R1): the copy is made only when nothing is being kept yet.
      if (fileNamed(COPY_NAME).exists) {
        return;
      }
      client.execSync(
        `ATTACH DATABASE ${sqlLiteral(pathOf(COPY_NAME))} AS ${COPY_SCHEMA} KEY "x'${key}'"`,
      );
      try {
        client.execSync(`SELECT sqlcipher_export('${COPY_SCHEMA}')`);
      } finally {
        client.execSync(`DETACH DATABASE ${COPY_SCHEMA}`);
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
 * still be opened by E8. The key that may open the kept file is moved aside by the caller (#75 R2).
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
