import { type BudgetDatabase, createDatabase, type MigrationSafetyCopy } from "@budget-lens/db";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { type BootPlan, planBoot } from "./boot-plan";
import {
  COPY_FILE_NAME,
  closeOnce,
  createSafetyCopy,
  deleteDatabaseFile,
  type FileEncryption,
  fileEncryption,
  finishRestore,
  keptDatabaseFiles,
  presentDatabaseFiles,
} from "./database-files";
import { DATABASE_NAME } from "./database-names";
import { generateDatabaseKey, isDatabaseKey, readDatabaseKey, storeDatabaseKey } from "./db-key";
import { classifyKeyReadError } from "./open-error";

/**
 * Where the open sequence ended. Every case other than `ready` is a screen, never a crash and never a deleted
 * file (#34 §2).
 *
 * `key_missing` is the budget whose key is gone; `state_unrecognized` is the unknown state the boot plan
 * protects, where files of a budget are here that this launch cannot account for and nothing was written over
 * them (#75 R2).
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
  | { readonly kind: "state_unrecognized" }
  | { readonly kind: "storage_unreachable"; readonly error: unknown };

/** The same kinds without the open connection. */
export type OpenedWithoutDatabase = Exclude<OpenedDatabase, { readonly kind: "ready" }>;

type KeyFailure = Exclude<OpenedWithoutDatabase, { kind: "encryption_unavailable" }>;
type KeyResult = string | KeyFailure;

function isKeyFailure(value: unknown): value is KeyFailure {
  return typeof value === "object" && value !== null && "kind" in value;
}

/** SecureStore refusing to answer is its own case: a locked device can reject a read that has nothing wrong
 * with it, and showing "start over" for that would offer to throw away a budget (#34 §2). */
function storageUnreachable(error: unknown): KeyFailure {
  return { kind: "storage_unreachable", error };
}

const keyMissing: KeyFailure = { kind: "key_missing" };

/** Files this launch cannot account for: the recovery screen, and nothing written (#75 R2). */
const stateUnrecognized: KeyFailure = { kind: "state_unrecognized" };

/** A build whose SQLite has no SQLCipher never opens a file (#34 §2). */
const encryptionUnavailable: OpenedWithoutDatabase = { kind: "encryption_unavailable" };

/**
 * A new key, written and read back before the file is created (#34 §1). Only `planBoot` lets a launch reach
 * this, and `planBoot` reaches it only through `mayWriteKey`, which is the guard that a key possibly belonging
 * to a file on this device is never replaced (#75 R2). A leftover key with no files at all is the reinstall case
 * of #34 §1 and does get a new key, because the iOS Keychain survives an uninstall.
 */
async function storeNewKey(): Promise<KeyResult> {
  const key = generateDatabaseKey();
  try {
    await storeDatabaseKey(key);
  } catch (error) {
    return storageUnreachable(error);
  }
  return key;
}

/** SQLCipher in this build. Without it `PRAGMA key` silently does nothing and the file would be plaintext. */
function cipherAvailable(client: SQLiteDatabase): boolean {
  return client.getFirstSync<{ cipher_version: string }>("PRAGMA cipher_version") !== null;
}

/**
 * A wrong key is not reported by `PRAGMA key`: SQLCipher only fails once it reads a page (#34 §2). The error of
 * that first read decides: only the one saying the file is not a database says anything about the key (#75 R3);
 * a busy or failing device is something to retry, not something to throw a budget away for.
 */
function firstRead(client: SQLiteDatabase): { readonly error: unknown } | null {
  try {
    client.getFirstSync("SELECT count(*) FROM sqlite_master");
  } catch (error) {
    return { error };
  }
  return null;
}

/**
 * SQLCipher 4.12+ also reports whether the file has been keyed. A build without that pragma returns no row, and
 * then the read above stays the authoritative check (#34 §2).
 */
function cipherReportsKeyed(client: SQLiteDatabase): OpenedWithoutDatabase | null {
  const keyed =
    client.getFirstSync<{ cipher_status: number }>("PRAGMA cipher_status")?.cipher_status !== 0;
  return keyed ? null : encryptionUnavailable;
}

/** What the first read of a keyed file says, or `null` when the file can be read (#75 R3). */
function readOutcome(client: SQLiteDatabase): OpenedWithoutDatabase | null {
  const read = firstRead(client);
  if (read === null) {
    return null;
  }
  return classifyKeyReadError(read.error) === "key_missing"
    ? keyMissing
    : storageUnreachable(read.error);
}

/** The guards of #34 §2 in their required order; `null` means the connection is keyed and readable. */
function guardEncryption(client: SQLiteDatabase, key: string): OpenedWithoutDatabase | null {
  if (!cipherAvailable(client)) {
    return encryptionUnavailable;
  }
  client.execSync(`PRAGMA key = "x'${key}'"`);
  return readOutcome(client) ?? cipherReportsKeyed(client);
}

/**
 * The key this launch opens with: a fresh one for a first budget, the stored one for every other plan, and the
 * screen to show when the plan needs a key this device does not have.
 */
async function keyForPlan(plan: BootPlan, stored: string | KeyFailure | null): Promise<KeyResult> {
  if (plan === "fresh_database") {
    return storeNewKey();
  }
  return isDatabaseKey(stored) ? stored : keyMissing;
}

/**
 * Put the files in the state the open sequence expects. `finish_restore` is the only plan that touches them
 * (#75 R1): the live file is missing while the copy or an interrupted restore is still here, and the key that
 * opens them is the one already stored. `protect_existing_files` writes nothing at all (#75 R2).
 */
function prepareFiles(plan: BootPlan): OpenedWithoutDatabase | null {
  if (plan === "protect_existing_files") {
    return stateUnrecognized;
  }
  if (plan === "finish_restore") {
    try {
      finishRestore();
    } catch (error) {
      return storageUnreachable(error);
    }
  }
  return null;
}

function stopBeforeOpening(
  client: SQLiteDatabase,
  created: boolean,
  failure: OpenedWithoutDatabase,
): OpenedDatabase {
  client.closeSync();
  if (created && failure.kind === "encryption_unavailable") {
    // Asking expo-sqlite for a file created it; a build that cannot encrypt must not keep a plaintext database.
    // Nothing else ever deletes a file here: a failed key read keeps the file it could not read (#34 §2).
    deleteDatabaseFile();
  }
  return failure;
}

/**
 * Open `budget-lens.db` encrypted, in the order the guards require (#34 §2).
 *
 * 1. What the files and the stored key mean for this launch (`boot-plan.ts`): only a launch that found nothing
 *    of a budget writes a key or creates a file (#75 R1, R2).
 * 2. `PRAGMA cipher_version` first: in a build without SQLCipher, `PRAGMA key` silently does nothing and the
 *    budget would be written in plaintext, so such a build stops instead (ADR 0007, expo/expo #51757).
 * 3. `PRAGMA key` with the device key, as the first operation after that guard.
 * 4. A read, because only reading tells a wrong key from a right one (#75 R3).
 *
 * A budget that is there but whose key is not, and a wrong key, are the same case; neither deletes anything.
 */
export async function openEncryptedDatabase(options: {
  readonly changeListener: boolean;
}): Promise<OpenedDatabase> {
  const stored = await readDatabaseKey().catch(storageUnreachable);
  if (isKeyFailure(stored)) {
    return stored;
  }
  const hasKey = isDatabaseKey(stored);
  const plan = planBoot({ ...presentDatabaseFiles(), key: hasKey });
  const key = await keyForPlan(plan, stored);
  if (!isDatabaseKey(key)) {
    return key;
  }
  const prepared = prepareFiles(plan);
  return prepared ?? openKeyed(key, plan === "fresh_database", options.changeListener);
}

/** Ask expo-sqlite for the file and put the guards of #34 §2 in front of every query. */
async function openKeyed(
  key: string,
  fresh: boolean,
  changeListener: boolean,
): Promise<OpenedDatabase> {
  // `enableChangeListener` feeds live reads (#35 §4); only one connection per session may claim it.
  const client = await openDatabaseAsync(DATABASE_NAME, { enableChangeListener: changeListener });
  const failure = guardEncryption(client, key);
  if (failure !== null) {
    return stopBeforeOpening(client, fresh, failure);
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
  /** The files a "start over" kept, with their encryption state (#75 R6). */
  readonly kept: { readonly name: string; readonly state: FileEncryption }[];
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
  // A copy left by a failed migration is the state a budget was put back to, so this check measures the copy it
  // finds and only removes a copy it took itself (#75 R1).
  const found = presentDatabaseFiles();
  let copy: FileEncryption = "missing";
  try {
    const cipherVersion = pragma(client, "cipher_version");
    const cipherStatus = pragma(client, "cipher_status");
    const database = await fileEncryption(DATABASE_NAME);
    if (!found.copy) {
      safetyCopy.create();
    }
    copy = await fileEncryption(COPY_FILE_NAME);
    return { cipherVersion, cipherStatus, database, copy, kept: await keptDatabaseFiles() };
  } finally {
    if (!found.copy) {
      safetyCopy.discard();
    }
    close();
  }
}

/**
 * Development only (#75): read this build's cipher pragmas, look at the files of the app, and take a real
 * pre-migration copy through the same steps the app uses before migrating, so a development build can show that
 * both files come back as ciphertext. A copy this check took itself is discarded again; a copy the app is
 * keeping is left alone. Release builds never call this.
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
