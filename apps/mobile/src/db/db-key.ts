import { getRandomBytes } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

/**
 * The SecureStore entry holding the database key (#34 §1).
 *
 * The key is device-only on purpose: it never goes to a cloud or to another phone, and recovery goes through the
 * encrypted backup of E8, not through the operating system.
 */
const KEY_NAME = "bl.db.key.v1";

/** Where the key of a database a "start over" kept is moved, so the kept file can still be opened by E8 (#75 R2). */
const KEPT_KEY_PREFIX = "bl.db.key.orphan-";

// `*_THIS_DEVICE_ONLY` keeps the key out of iCloud and Google backups (owner decision, #34 2026-10-19). No
// `requireAuthentication`: an entry protected that way becomes unreadable when the user changes their biometrics,
// which for us would mean the budget is gone forever.
const KEY_OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

// 32 random bytes as lowercase hex, used as a SQLCipher raw key: `PRAGMA key = "x'<hex>'"`. Anything else is not
// our key, and interpolating an untrusted string into the pragma is not an option either.
const DATABASE_KEY = /^[\da-f]{64}$/;

/** A fresh key: 32 random bytes, written as lowercase hex. */
export function generateDatabaseKey(): string {
  return Array.from(getRandomBytes(32), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * The stored key, or `null` when there is none.
 *
 * A rejection is not a missing key: a locked device can make the Keychain refuse to answer (#34 §2), and treating
 * that as "no key" would offer the user a destructive reset for nothing.
 */
export function readDatabaseKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_NAME, KEY_OPTIONS);
}

/**
 * Store a key and read it back, before any database file is created (#34 §1). A key nobody can read again is the
 * one failure that would lose the data, so a mismatch is an error rather than a warning.
 */
export async function storeDatabaseKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_NAME, key, KEY_OPTIONS);
  if ((await SecureStore.getItemAsync(KEY_NAME, KEY_OPTIONS)) !== key) {
    throw new Error("The stored database key could not be read back");
  }
}

/** Whether a value read from SecureStore can be used as the raw key at all. */
export function isDatabaseKey(value: unknown): value is string {
  return typeof value === "string" && DATABASE_KEY.test(value);
}

/**
 * Move the current key to the name of a kept database before a new one takes its place (#75 R2). Overwriting it
 * would leave the file that was kept openable by nobody: E8 (#96/#97) is meant to read such files again.
 *
 * The copy is written before the original is deleted, so a failure in between leaves the key twice rather than
 * not at all, and a "start over" that cannot move the key does not write a new one.
 */
export async function moveDatabaseKeyAside(stamp: number): Promise<void> {
  const key = await readDatabaseKey();
  if (key === null) {
    return;
  }
  await SecureStore.setItemAsync(`${KEPT_KEY_PREFIX}${String(stamp)}`, key, KEY_OPTIONS);
  await SecureStore.deleteItemAsync(KEY_NAME, KEY_OPTIONS);
}

/**
 * Forget the key of the database on this device, as if it had never been stored.
 *
 * Development only (#75 R6): it exists so a development build can reach the recovery screen through a real
 * unreadable database file instead of a rendered mock. Deleting the key of a database that is still on the device
 * makes that budget unreadable for good, so this refuses outside `__DEV__` even though the route that calls it is
 * already unreachable in a release build (#75 R7). Nothing in the app itself ever removes a key.
 */
export async function forgetDatabaseKey(): Promise<boolean> {
  if (!__DEV__) {
    return false;
  }
  const key = await readDatabaseKey();
  if (key === null) {
    return false;
  }
  await SecureStore.deleteItemAsync(KEY_NAME, KEY_OPTIONS);
  return true;
}
