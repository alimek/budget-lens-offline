import { type BudgetDatabase, createDatabase, type MigrationSafetyCopy } from "@budget-lens/db";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import {
  COPY_FILE_NAME,
  closeOnce,
  createSafetyCopy,
  DATABASE_NAME,
  databaseExists,
  deleteDatabaseFile,
  type FileEncryption,
  fileEncryption,
} from "./database-files";
import { generateDatabaseKey, isDatabaseKey, readDatabaseKey, storeDatabaseKey } from "./db-key";

/**
 * Where the open sequence ended. Every case other than `ready` is a screen, never a crash and never a deleted
 * file (#34 §2).
 */
export type OpenedDatabase =
  | {
      readonly kind: "ready";
      readonly client: SQLiteDatabase;
      readonly db: BudgetDatabase;
      readonly safetyCopy: MigrationSafetyCopy;
      readonly close: () => void;
    }
  | { readonly kind: "encryption_unavailable" }
  | { readonly kind: "key_missing" }
  | { readonly kind: "storage_unreachable"; readonly error: unknown };

/** The same kinds without the open connection. */
export type OpenedWithoutDatabase = Exclude<OpenedDatabase, { readonly kind: "ready" }>;

type KeyFailure = Extract<OpenedWithoutDatabase, { kind: "key_missing" | "storage_unreachable" }>;
type KeyResult = string | KeyFailure;

function isKeyFailure(value: unknown): value is KeyFailure {
  return typeof value === "object" && value !== null && "kind" in value;
}

/** SecureStore refusing to answer is its own case: a locked device can reject a read that has nothing wrong
 * with it, and showing "start over" for that would offer to throw away a budget (#34 §2). */
function storageUnreachable(error: unknown): KeyFailure {
  return { kind: "storage_unreachable", error };
}

/** A new key, written and read back before the file is created (#34 §1). */
async function storeNewKey(): Promise<KeyResult> {
  const key = generateDatabaseKey();
  try {
    await storeDatabaseKey(key);
  } catch (error) {
    return storageUnreachable(error);
  }
  return key;
}

/**
 * The key for this launch: the stored one, a fresh one when there is no database yet (the iOS Keychain survives
 * an uninstall, so a new file always gets a new key), or the screen to show instead.
 */
async function resolveKey(isNewDatabase: boolean): Promise<KeyResult> {
  if (isNewDatabase) {
    return storeNewKey();
  }
  const stored = await readDatabaseKey().catch(storageUnreachable);
  if (isKeyFailure(stored)) {
    return stored;
  }
  return isDatabaseKey(stored) ? stored : { kind: "key_missing" };
}

/** SQLCipher in this build. Without it `PRAGMA key` silently does nothing and the file would be plaintext. */
function cipherAvailable(client: SQLiteDatabase): boolean {
  return client.getFirstSync<{ cipher_version: string }>("PRAGMA cipher_version") !== null;
}

/** A wrong key is not reported by `PRAGMA key`: SQLCipher only fails once it reads a page (#34 §2). */
function keyOpensTheFile(client: SQLiteDatabase): boolean {
  try {
    client.getFirstSync("SELECT count(*) FROM sqlite_master");
  } catch {
    return false;
  }
  return true;
}

/**
 * SQLCipher 4.12+ also reports whether the file has been keyed. A build without that pragma returns no row, and
 * then the read above stays the authoritative check (#34 §2).
 */
function cipherReportsKeyed(client: SQLiteDatabase): boolean {
  return (
    client.getFirstSync<{ cipher_status: number }>("PRAGMA cipher_status")?.cipher_status !== 0
  );
}

/** The guards of #34 §2 in their required order; `null` means the connection is keyed and readable. */
function guardEncryption(
  client: SQLiteDatabase,
  key: string,
): "encryption_unavailable" | "key_missing" | null {
  if (!cipherAvailable(client)) {
    return "encryption_unavailable";
  }
  client.execSync(`PRAGMA key = "x'${key}'"`);
  if (!keyOpensTheFile(client)) {
    return "key_missing";
  }
  return cipherReportsKeyed(client) ? null : "encryption_unavailable";
}

function stopBeforeOpening(
  client: SQLiteDatabase,
  created: boolean,
  kind: "encryption_unavailable" | "key_missing",
): OpenedDatabase {
  client.closeSync();
  if (created) {
    // Asking expo-sqlite for a file created it; a build that cannot encrypt must not keep a plaintext database.
    deleteDatabaseFile();
  }
  return { kind };
}

/**
 * Open `budget-lens.db` encrypted, in the order the guards require (#34 §2).
 *
 * 1. `PRAGMA cipher_version` first: in a build without SQLCipher, `PRAGMA key` silently does nothing and the
 *    budget would be written in plaintext, so such a build stops instead (ADR 0007, expo/expo #51757).
 * 2. `PRAGMA key` with the device key, as the first operation after that guard.
 * 3. A read, because only reading tells a wrong key from a right one.
 *
 * A budget that is there but whose key is not, and a wrong key, are the same case; neither deletes anything.
 */
export async function openEncryptedDatabase(options: {
  readonly changeListener: boolean;
}): Promise<OpenedDatabase> {
  const created = !databaseExists();
  const key = await resolveKey(created);
  if (!isDatabaseKey(key)) {
    return key;
  }

  // `enableChangeListener` feeds live reads (#35 §4); only one connection per session may claim it.
  const client = await openDatabaseAsync(DATABASE_NAME, {
    enableChangeListener: options.changeListener,
  });
  const failure = guardEncryption(client, key);
  if (failure !== null) {
    return stopBeforeOpening(client, created, failure);
  }

  const close = closeOnce(client);
  return {
    kind: "ready",
    client,
    db: createDatabase(client),
    safetyCopy: createSafetyCopy({ client, key, closeConnection: close }),
    close,
  };
}

/** What the development storage check reads from this build and its files (#75). */
export interface EncryptedStorageCheck {
  readonly cipherVersion: string | number | null;
  readonly cipherStatus: string | number | null;
  readonly database: FileEncryption;
  readonly copy: FileEncryption;
}

export type StorageCheckOutcome =
  | OpenedWithoutDatabase
  | { readonly kind: "ready"; readonly check: EncryptedStorageCheck };

function pragma(client: SQLiteDatabase, name: string): string | number | null {
  const row = client.getFirstSync<Record<string, string | number | null>>(`PRAGMA ${name}`);
  if (row === null) {
    return null;
  }
  return row[name] ?? null;
}

async function measureEncryption(
  client: SQLiteDatabase,
  safetyCopy: MigrationSafetyCopy,
  close: () => void,
): Promise<EncryptedStorageCheck> {
  let copy: FileEncryption = "missing";
  try {
    const cipherVersion = pragma(client, "cipher_version");
    const cipherStatus = pragma(client, "cipher_status");
    const database = await fileEncryption(DATABASE_NAME);
    safetyCopy.create();
    copy = await fileEncryption(COPY_FILE_NAME);
    return { cipherVersion, cipherStatus, database, copy };
  } finally {
    safetyCopy.discard();
    close();
  }
}

/**
 * Development only (#75): read this build's cipher pragmas and take a real pre-migration copy through the same
 * steps the app uses before migrating, so a development build can show that both files come back as ciphertext.
 * The copy is discarded again; release builds never call this.
 */
export async function checkEncryptedStorage(): Promise<StorageCheckOutcome> {
  const opened = await openEncryptedDatabase({ changeListener: false });
  if (opened.kind !== "ready") {
    return opened;
  }
  return {
    kind: "ready",
    check: await measureEncryption(opened.client, opened.safetyCopy, opened.close),
  };
}
