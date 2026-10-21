import type { MigrationSafetyCopy } from "@budget-lens/db";
import { File } from "expo-file-system";
import { defaultDatabaseDirectory, type SQLiteDatabase } from "expo-sqlite";

/** The SQLCipher database of the app, in expo-sqlite's own database directory. */
export const DATABASE_NAME = "budget-lens.db";

/** The encrypted copy taken before a migration (#35 Q3), and the prefix a "start over" renames the file to. */
const COPY_NAME = "budget-lens.pre-migration.db";
const ORPHAN_PREFIX = "budget-lens.orphan-";

/** The schema name the copy is attached under while `sqlcipher_export` writes it. */
const COPY_SCHEMA = "pre_migration";

/** The 16 bytes every unencrypted SQLite database starts with. */
const PLAINTEXT_HEADER = "SQLite format 3\0";

// expo-sqlite reports its database directory as a plain path; expo-file-system addresses files by URI, and a
// bare path is not one (#34 §7). Without the scheme, `exists` throws instead of answering.
const databaseDirectory = `file://${String(defaultDatabaseDirectory).replace(/^file:\/\//, "")}`;

function fileNamed(name: string): File {
  return new File(databaseDirectory, name);
}

/** The `-wal` and `-shm` files that can sit next to a database; they belong to it, so they go with it. */
function sideFilesOf(name: string): File[] {
  return ["-wal", "-shm"].map((suffix) => fileNamed(`${name}${suffix}`));
}

function remove(name: string): void {
  for (const file of [fileNamed(name), ...sideFilesOf(name)]) {
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

/** Whether the database file exists before anything opens it: expo-sqlite creates whatever it is asked to open. */
export function databaseExists(): boolean {
  return fileNamed(DATABASE_NAME).exists;
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

/** The name the copy is kept under, for the development storage check. */
export const COPY_FILE_NAME = COPY_NAME;

/**
 * The encrypted copy of #35 §2. It is written by the open connection through `sqlcipher_export` into a database
 * attached with the same key, so the copy is exactly as unreadable as the live file – unlike a plain file copy
 * of a database that is still in WAL mode, it is also consistent.
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
      remove(COPY_NAME);
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
      remove(DATABASE_NAME);
      fileNamed(COPY_NAME).copySync(fileNamed(DATABASE_NAME));
    },
    discard() {
      remove(COPY_NAME);
    },
  };
}

/**
 * "Start over" from the recovery screen: the database the app cannot open is renamed and kept, never deleted –
 * #34 keeps it for support, and E8 (#96/#97) decides when such files go away. The next launch finds no file and
 * starts with a new key.
 */
export function renameDatabaseAside(): void {
  const file = fileNamed(DATABASE_NAME);
  if (file.exists) {
    file.rename(`${ORPHAN_PREFIX}${String(Date.now())}.db`);
  }
  // Stale side files must not meet the fresh database that takes their name.
  for (const side of sideFilesOf(DATABASE_NAME)) {
    if (side.exists) {
      side.delete();
    }
  }
}
