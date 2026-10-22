/**
 * "Start over" from a recovery screen: the budget this app cannot open is set aside and a fresh, empty one takes
 * its place. The order of the steps is the whole point of this module – a wrong order can leave the database file
 * renamed while its key stays behind under the live name, which strands a budget that was fine (#217 R1).
 *
 * The steps themselves are injected, as `MigrationSafetyCopy` injects the file work of a migration: this package
 * decides when each one runs and what a failure means, and never touches SecureStore or the filesystem.
 */

/** A step that runs on the device and answers synchronously or asynchronously. */
type MaybePromise<T> = T | Promise<T>;

/** Where the device stands, as far as the order of the steps cares. */
export interface StartOverFiles {
  /** A budget file of this app is still under a live name: the database, the copy or the interrupted restore. */
  readonly liveFiles: boolean;
  /** The stamps in the names of the budget files this app has already kept. */
  readonly keptFiles: readonly number[];
}

/**
 * The device operations of a start over, in the order `startOverWithKeptKey` calls them. Each one throws when the
 * device refuses it; which of them threw decides what the user is told and what is left behind.
 */
export interface StartOverSteps {
  /**
   * Write a value to secure storage, read it back and remove it (#217 R1). Everything below needs a working
   * secure storage: a fresh database gets a new key. It runs for every start over, whatever the screen was, and
   * when it fails nothing else runs at all.
   */
  probeSecureStorage(): MaybePromise<void>;
  /** The key stored under the live name, or `null` when there is none. */
  readLiveKey(): MaybePromise<string | null>;
  /** The kept key entries that already exist, by the stamp in their name. */
  readKeptKeys(): MaybePromise<ReadonlyMap<number, string>>;
  /** Which budget files are where right now. */
  inspectFiles(): MaybePromise<StartOverFiles>;
  /**
   * Store the key under the stamp of the file it belongs to and read it back, so the kept file can still be
   * opened by E8 (#96/#97). It never replaces a different key already kept under that stamp.
   */
  storeKeptKey(stamp: number, key: string): MaybePromise<void>;
  /**
   * Rename the live database with its side files, the pre-migration copy and the interrupted restore aside under
   * this run's stamp (#75 R5). Nothing here deletes: kept files leave with E8.
   */
  renameFilesAside(): MaybePromise<void>;
  /** Remove the key under the live name, once the kept files and the key beside them are safe. */
  deleteLiveKey(): MaybePromise<void>;
}

/** Where the key currently under the live name goes. */
export type KeptKeyPlan =
  /** There is no key to move: the files were kept without one, or it is gone (#75 R2). */
  | { readonly kind: "no_key" }
  /** Store this key under `stamp` before the files move there. */
  | { readonly kind: "keep"; readonly stamp: number; readonly key: string }
  /** The key is already readable under `stamp`, so only the entry under the live name is left over. */
  | { readonly kind: "already_kept"; readonly stamp: number }
  /**
   * No stamp can be given this key without guessing or overwriting a key that is already kept, so nothing moves
   * and nothing is deleted.
   */
  | { readonly kind: "unpairable" };

/**
 * Decide where the key under the live name belongs (#217 R5). E8 (#96/#97) opens a kept file by the key kept
 * beside it, so a key must end up under the stamp of the file it opens, and a key that is already kept is never
 * overwritten.
 *
 * - A budget file still under a live name is about to be renamed to this run's stamp, so its key goes there.
 * - Otherwise the key belongs to a file that is already kept: to the newest kept file that has no key of its own
 *   yet. When several kept files lack a key, that newest one is the file of the launch that failed midway, and
 *   every older one was kept by a start over that moved its key successfully; pairing them by their moment is
 *   also what their names carry.
 * - When every kept file already has a key, the live entry is a leftover of a start over whose delete failed: it
 *   is already paired if it holds the same key as one of the kept entries, and belongs to nothing known if not.
 */
export function planStartOverKey(options: {
  readonly liveKey: string | null;
  readonly stamp: number;
  readonly files: StartOverFiles;
  readonly keptKeys: ReadonlyMap<number, string>;
}): KeptKeyPlan {
  const { liveKey, stamp, files, keptKeys } = options;
  if (liveKey === null) {
    return { kind: "no_key" };
  }
  const atThisStamp = keptKeys.get(stamp);
  if (atThisStamp === liveKey) {
    return { kind: "already_kept", stamp };
  }
  if (atThisStamp !== undefined) {
    return { kind: "unpairable" };
  }
  if (files.liveFiles) {
    return { kind: "keep", stamp, key: liveKey };
  }
  const unpaired = files.keptFiles.filter((kept) => !keptKeys.has(kept));
  const newest = unpaired.length === 0 ? undefined : unpaired.reduce((a, b) => (a > b ? a : b));
  if (newest !== undefined) {
    return { kind: "keep", stamp: newest, key: liveKey };
  }
  const paired = files.keptFiles.find((kept) => keptKeys.get(kept) === liveKey);
  return paired === undefined ? { kind: "unpairable" } : { kind: "already_kept", stamp: paired };
}

/** Why a start over stopped without touching the budget of the device. */
export type StartOverBlocker =
  /** Secure storage will not answer, so no start over can end with a database whose key can be read again. */
  | "secure_storage"
  /** The key cannot be paired with a file without guessing or overwriting one that is already kept. */
  | "key_pairing";

/** How far a start over got. */
export type StartOverOutcome =
  /** The old budget is set aside with its key beside it, and a fresh one can be created. */
  | { readonly kind: "done" }
  /** Nothing of a budget was renamed and no key was moved; the screen says why in plain words. */
  | { readonly kind: "blocked"; readonly blocker: StartOverBlocker };

/**
 * Set the budget of the device aside and leave room for a fresh one, in the order that cannot strand it
 * (#217 R1, R5):
 *
 * 1. Prove secure storage answers, or stop with `secure_storage`: every start over ends by storing a new key,
 *    and a budget under a key nobody can read again is lost.
 * 2. Read what is where, and decide which stamp the current key belongs to. A key that cannot be paired stops
 *    with `key_pairing` rather than overwrite one already kept or land on the wrong file.
 * 3. Write the key under that stamp and read it back, before a single file moves.
 * 4. Rename the files aside.
 * 5. Only now delete the key under the live name.
 *
 * A failing step 3 leaves the live file with its key; a failing step 4 or 5 leaves kept files with a readable key
 * under their kept name, and the live entry is never dropped while a file still needs it. Those two fail with
 * their error: the device refused an operation, which is what `storage_unreachable` is for.
 */
export async function startOverWithKeptKey(options: {
  readonly stamp: number;
  readonly steps: StartOverSteps;
}): Promise<StartOverOutcome> {
  const { stamp, steps } = options;
  let plan: KeptKeyPlan;
  try {
    await steps.probeSecureStorage();
    plan = planStartOverKey({
      liveKey: await steps.readLiveKey(),
      stamp,
      files: await steps.inspectFiles(),
      keptKeys: await steps.readKeptKeys(),
    });
  } catch {
    return { kind: "blocked", blocker: "secure_storage" };
  }
  if (plan.kind === "unpairable") {
    return { kind: "blocked", blocker: "key_pairing" };
  }
  if (plan.kind === "keep") {
    try {
      await steps.storeKeptKey(plan.stamp, plan.key);
    } catch {
      // Still nothing renamed: the budget keeps its file and its key, and the user reads the same screen.
      return { kind: "blocked", blocker: "secure_storage" };
    }
  }
  // From here on the key of the kept files is safe under its kept name, so a failure may report the refusal of
  // the device instead, and the live key stays where it is until the rename is through.
  await steps.renameFilesAside();
  if (plan.kind !== "no_key") {
    await steps.deleteLiveKey();
  }
  return { kind: "done" };
}
