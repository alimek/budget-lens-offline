import { describe, expect, it } from "vitest";
import { planStartOverKey, type StartOverSteps, startOverWithKeptKey } from "../src";

/** The budget files a device can hold under a live name; a kept one is `orphan-<stamp>.<name>`. */
type LiveName = "database" | "copy" | "restoring";

const LIVE_NAMES: readonly LiveName[] = ["database", "copy", "restoring"];

const KEY = "a".repeat(64);
const OTHER_KEY = "b".repeat(64);
const STAMP = 1_700_000_000_000;

/** The step that a fake device can refuse, standing for the failure the device answers with. */
type Failure =
  | "probe_write"
  | "probe_read_back"
  | "kept_key_write"
  | "kept_key_read_back"
  | "rename"
  | "live_key_delete";

interface Fake {
  readonly steps: StartOverSteps;
  /** The steps the runner asked for, in the order it asked. */
  readonly calls: string[];
  readonly keys: { live: string | null; kept: Map<number, string> };
  readonly files: Set<string>;
}

function fake(options: {
  readonly liveKey?: string | null;
  readonly live?: readonly LiveName[];
  readonly kept?: readonly { readonly stamp: number; readonly name: LiveName }[];
  readonly keptKeys?: readonly (readonly [number, string])[];
  readonly fails?: readonly Failure[];
}): Fake {
  const refuses = (failure: Failure) => options.fails?.includes(failure) === true;
  const keys = { live: options.liveKey ?? null, kept: new Map(options.keptKeys ?? []) };
  const files = new Set<string>([
    ...(options.live ?? []),
    ...(options.kept ?? []).map((kept) => `orphan-${String(kept.stamp)}.${kept.name}`),
  ]);
  const calls: string[] = [];
  const run = <T>(call: string, work: () => T): T => {
    calls.push(call);
    return work();
  };
  return {
    calls,
    keys,
    files,
    steps: {
      probeSecureStorage() {
        run("probe", () => {
          if (refuses("probe_write")) {
            throw new Error("secure storage refused the probe write");
          }
          if (refuses("probe_read_back")) {
            throw new Error("the probe could not be read back");
          }
        });
      },
      readLiveKey: () => run("read_live_key", () => keys.live),
      readKeptKeys: () => run("read_kept_keys", () => new Map(keys.kept)),
      inspectFiles: () =>
        run("inspect_files", () => ({
          liveFiles: LIVE_NAMES.some((name) => files.has(name)),
          keptFiles: [...files]
            .map((name) => Number(/^orphan-(\d+)\./.exec(name)?.[1]))
            .filter((stamp) => Number.isFinite(stamp)),
        })),
      storeKeptKey(stamp, key) {
        run("store_kept_key", () => {
          const existing = keys.kept.get(stamp);
          if (existing !== undefined && existing !== key) {
            throw new Error("a different key is already kept under that stamp");
          }
          if (refuses("kept_key_write")) {
            throw new Error("secure storage refused the write");
          }
          keys.kept.set(stamp, key);
          if (refuses("kept_key_read_back") || keys.kept.get(stamp) !== key) {
            throw new Error("the kept key could not be read back");
          }
        });
      },
      renameFilesAside() {
        run("rename_files_aside", () => {
          const moved = [...(options.live ?? [])];
          for (const [index, name] of moved.entries()) {
            // A device that fails midway has already moved the files before this one and none after it.
            if (refuses("rename") && index === moved.length - 1) {
              throw new Error("the rename failed");
            }
            files.delete(name);
            files.add(`orphan-${String(STAMP)}.${name}`);
          }
        });
      },
      deleteLiveKey() {
        run("delete_live_key", () => {
          if (refuses("live_key_delete")) {
            throw new Error("secure storage refused the delete");
          }
          keys.live = null;
        });
      },
    },
  };
}

const run = (device: Fake) => startOverWithKeptKey({ stamp: STAMP, steps: device.steps });

/** The stamps the device keeps a key under, sorted. */
const keptStamps = (device: Fake) => [...device.keys.kept.keys()].sort();

describe("startOverWithKeptKey", () => {
  it("pairs the key with the stamp the files are about to be kept under, and only then drops the live key", async () => {
    // Arrange
    const device = fake({ liveKey: KEY, live: ["database"] });

    // Act
    await expect(run(device)).resolves.toEqual({ kind: "done" });

    // Assert
    expect(device.calls).toEqual([
      "probe",
      "read_live_key",
      "inspect_files",
      "read_kept_keys",
      "store_kept_key",
      "rename_files_aside",
      "delete_live_key",
    ]);
    expect(device.keys).toEqual({ live: null, kept: new Map([[STAMP, KEY]]) });
    expect([...device.files]).toEqual([`orphan-${String(STAMP)}.database`]);
  });

  it("keeps the live database and its pre-migration copy as one budget under one key", async () => {
    // Arrange: a migration that failed and was put back leaves both files behind (#75 R1)
    const device = fake({ liveKey: KEY, live: ["database", "copy"] });

    // Act
    await expect(run(device)).resolves.toEqual({ kind: "done" });

    // Assert: nothing of the kept budget is left under a live name, and one key opens all of it
    expect(device.files.has("copy")).toBe(false);
    expect(device.files.has("restoring")).toBe(false);
    expect(device.keys).toEqual({ live: null, kept: new Map([[STAMP, KEY]]) });
  });

  it("renames an interrupted restore aside with the same stamp", async () => {
    // Arrange
    const device = fake({ liveKey: KEY, live: ["database", "copy", "restoring"] });

    // Act
    await expect(run(device)).resolves.toEqual({ kind: "done" });

    // Assert
    expect([...device.files].sort()).toEqual([
      `orphan-${String(STAMP)}.copy`,
      `orphan-${String(STAMP)}.database`,
      `orphan-${String(STAMP)}.restoring`,
    ]);
  });

  it("moves nothing when secure storage cannot write the probe", async () => {
    // Arrange
    const device = fake({ liveKey: KEY, live: ["database"], fails: ["probe_write"] });

    // Act
    await expect(run(device)).resolves.toEqual({
      kind: "blocked",
      blocker: "secure_storage",
    });

    // Assert: not one file or key was touched
    expect(device.calls).toEqual(["probe"]);
    expect(device.keys).toEqual({ live: KEY, kept: new Map() });
    expect([...device.files]).toEqual(["database"]);
  });

  it("moves nothing when the probe cannot be read back", async () => {
    // Arrange
    const device = fake({ liveKey: KEY, live: ["database"], fails: ["probe_read_back"] });

    // Act
    const outcome = await run(device);

    // Assert
    expect(outcome).toEqual({ kind: "blocked", blocker: "secure_storage" });
    expect(device.calls).toEqual(["probe"]);
    expect(device.files.has("database")).toBe(true);
  });

  it("leaves the file with its key when the kept key cannot be written", async () => {
    // Arrange
    const device = fake({ liveKey: KEY, live: ["database"], fails: ["kept_key_write"] });

    // Act
    const outcome = await run(device);

    // Assert: the budget is exactly as it was, so the same screen and a retry still make sense
    expect(outcome).toEqual({ kind: "blocked", blocker: "secure_storage" });
    expect(device.calls).toEqual([
      "probe",
      "read_live_key",
      "inspect_files",
      "read_kept_keys",
      "store_kept_key",
    ]);
    expect(device.keys).toEqual({ live: KEY, kept: new Map() });
    expect([...device.files]).toEqual(["database"]);
  });

  it("refuses to rename when the kept key cannot be read back", async () => {
    // Arrange
    const device = fake({ liveKey: KEY, live: ["database"], fails: ["kept_key_read_back"] });

    // Act
    const outcome = await run(device);

    // Assert
    expect(outcome).toEqual({ kind: "blocked", blocker: "secure_storage" });
    expect(device.calls).not.toContain("rename_files_aside");
    expect(device.files.has("database")).toBe(true);
  });

  it("starts over with no key to move, because the fresh database gets a new one", async () => {
    // Arrange: the key-missing screen, where the file is here and its key is not
    const device = fake({ liveKey: null, live: ["database"] });

    // Act
    await expect(run(device)).resolves.toEqual({ kind: "done" });

    // Assert
    expect(device.calls).toEqual([
      "probe",
      "read_live_key",
      "inspect_files",
      "read_kept_keys",
      "rename_files_aside",
    ]);
    expect([...device.files]).toEqual([`orphan-${String(STAMP)}.database`]);
    expect(device.keys.kept.size).toBe(0);
  });

  it("leaves the live key behind when a file rename fails midway", async () => {
    // Arrange: the last of the files cannot be moved
    const device = fake({ liveKey: KEY, live: ["database", "copy"], fails: ["rename"] });

    // Act
    await expect(run(device)).rejects.toThrow("the rename failed");

    // Assert: the file still under a live name keeps the key it needs, and the moved one has its key too
    expect(device.files.has("copy")).toBe(true);
    expect(device.keys).toEqual({ live: KEY, kept: new Map([[STAMP, KEY]]) });
    expect(device.calls).not.toContain("delete_live_key");
  });

  it("keeps both key entries when the live key cannot be deleted", async () => {
    // Arrange
    const device = fake({ liveKey: KEY, live: ["database"], fails: ["live_key_delete"] });

    // Act
    await expect(run(device)).rejects.toThrow("secure storage refused the delete");

    // Assert: the kept file has its key, and the live entry is a duplicate rather than a missing one
    expect(device.keys).toEqual({ live: KEY, kept: new Map([[STAMP, KEY]]) });
    expect([...device.files]).toEqual([`orphan-${String(STAMP)}.database`]);
  });

  it("pairs the key with the newest kept file that has no key of its own", async () => {
    // Arrange: `state_unrecognized` – the live file is gone, two are kept, and only the older one has a key
    const device = fake({
      liveKey: KEY,
      kept: [
        { stamp: 100, name: "database" },
        { stamp: 200, name: "database" },
      ],
      keptKeys: [[100, OTHER_KEY]],
    });

    // Act
    await expect(run(device)).resolves.toEqual({ kind: "done" });

    // Assert: the key lands under the stamp of the file it opens, so E8 can still open it (#217 R5)
    expect(device.keys).toEqual({
      live: null,
      kept: new Map([
        [100, OTHER_KEY],
        [200, KEY],
      ]),
    });
    expect(device.calls).toContain("store_kept_key");
  });

  it("never overwrites a key that is already kept beside a file", async () => {
    // Arrange: the only kept file has a key, so the live one belongs to nothing this launch can name
    const device = fake({
      liveKey: KEY,
      kept: [{ stamp: 200, name: "database" }],
      keptKeys: [[200, OTHER_KEY]],
    });

    // Act
    const outcome = await run(device);

    // Assert: nothing moved and no key was replaced
    expect(outcome).toEqual({ kind: "blocked", blocker: "key_pairing" });
    expect(device.keys).toEqual({ live: KEY, kept: new Map([[200, OTHER_KEY]]) });
    expect(device.calls).not.toContain("store_kept_key");
    expect(device.calls).not.toContain("rename_files_aside");
  });

  it("drops only the leftover live key of a start over whose delete failed", async () => {
    // Arrange: the same key is already paired with the kept file
    const device = fake({
      liveKey: KEY,
      kept: [{ stamp: 200, name: "database" }],
      keptKeys: [[200, KEY]],
    });

    // Act
    await expect(run(device)).resolves.toEqual({ kind: "done" });

    // Assert
    expect(device.calls).not.toContain("store_kept_key");
    expect(keptStamps(device)).toEqual([200]);
    expect(device.keys.live).toBeNull();
  });
});

describe("planStartOverKey", () => {
  const files = (options: { liveFiles?: boolean; keptFiles?: readonly number[] }) => ({
    liveFiles: options.liveFiles ?? false,
    keptFiles: options.keptFiles ?? [],
  });

  it("has nothing to keep when no key is stored", () => {
    // Arrange
    const options = {
      liveKey: null,
      stamp: STAMP,
      files: files({ liveFiles: true }),
      keptKeys: new Map(),
    };

    // Act
    const plan = planStartOverKey(options);

    // Assert
    expect(plan).toEqual({ kind: "no_key" });
  });

  it("pairs the key with this run's stamp while a budget file is still under a live name", () => {
    // Arrange
    const options = {
      liveKey: KEY,
      stamp: STAMP,
      files: files({ liveFiles: true, keptFiles: [100] }),
      keptKeys: new Map<number, string>(),
    };

    // Act
    const plan = planStartOverKey(options);

    // Assert
    expect(plan).toEqual({ kind: "keep", stamp: STAMP, key: KEY });
  });

  it("pairs the key with the newest kept file whose key was never moved", () => {
    // Arrange
    const options = {
      liveKey: KEY,
      stamp: STAMP,
      files: files({ keptFiles: [300, 100, 200] }),
      keptKeys: new Map([[100, OTHER_KEY]]),
    };

    // Act
    const plan = planStartOverKey(options);

    // Assert
    expect(plan).toEqual({ kind: "keep", stamp: 300, key: KEY });
  });

  it("reports a leftover live key that already opens a kept file as already paired", () => {
    // Arrange
    const options = {
      liveKey: KEY,
      stamp: STAMP,
      files: files({ keptFiles: [200] }),
      keptKeys: new Map([[200, KEY]]),
    };

    // Act
    const plan = planStartOverKey(options);

    // Assert
    expect(plan).toEqual({ kind: "already_kept", stamp: 200 });
  });

  it("refuses to pair a key that belongs to no file it can name", () => {
    // Arrange
    const options = {
      liveKey: KEY,
      stamp: STAMP,
      files: files({ keptFiles: [200] }),
      keptKeys: new Map([[200, OTHER_KEY]]),
    };

    // Act
    const plan = planStartOverKey(options);

    // Assert
    expect(plan).toEqual({ kind: "unpairable" });
  });
});
