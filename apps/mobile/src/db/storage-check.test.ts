import { describe, expect, it } from "vitest";
import type { DatabaseFileInventory } from "./database-files";
import { runStorageCheck, type StorageCheckFiles } from "./storage-check";

/**
 * The decision of the development storage check (#242, #75 R6): a copy the app is keeping is never touched, and
 * the only copy this check may remove is the one it took itself. The file work is injected, so the sequence of
 * operations it asks for is exactly what a device would do.
 */

/** The files of a launch: the live database, the copy beside it, and what the app is keeping. */
function found(overrides: Partial<DatabaseFileInventory> = {}): DatabaseFileInventory {
  return { database: "sqlite", copy: "missing", kept: [], ...overrides };
}

/** The files a check is handed, recording every operation it asks for. */
function fakeFiles(options: {
  readonly inventory: DatabaseFileInventory;
  readonly copyOn?: "sqlite" | "throw";
}): StorageCheckFiles & { readonly calls: string[] } {
  const calls: string[] = [];
  let ownCopy = false;
  return {
    calls,
    inspect() {
      calls.push("inspect");
      return ownCopy ? { ...options.inventory, copy: "sqlite" } : options.inventory;
    },
    takeCopy() {
      calls.push("takeCopy");
      if (options.copyOn === "throw") {
        throw new Error("the filesystem refused the copy");
      }
      ownCopy = true;
    },
    discardOwnCopy() {
      calls.push("discardOwnCopy");
      // The fake keeps whatever it was not given by its own `takeCopy`, so a kept copy survives the check.
      ownCopy = false;
    },
  };
}

describe("runStorageCheck", () => {
  it("reports a copy the app is keeping and asks for nothing to be done to it (#75 R1)", () => {
    // Arrange: an earlier launch failed and is keeping the older state; the check must not replace or delete it
    const files = fakeFiles({
      inventory: found({
        copy: "sqlite",
        kept: [{ name: "budget-lens.orphan-1.db", format: "foreign" }],
      }),
    });

    // Act
    const report = runStorageCheck(files);

    // Assert: one look at the files, no copy taken and no copy discarded
    expect(report.copy).toBe("kept");
    expect(report.inventory.copy).toBe("sqlite");
    expect(report.inventory.kept).toEqual([{ name: "budget-lens.orphan-1.db", format: "foreign" }]);
    expect(files.calls).toEqual(["inspect"]);
  });

  it("reports the files and opens nothing when there is no SQLite database to copy (#242)", () => {
    // Arrange: an unreadable file under the name of the database — opening a connection would create an empty
    // database over it or beside it
    const files = fakeFiles({ inventory: found({ database: "foreign" }) });

    // Act
    const report = runStorageCheck(files);

    // Assert
    expect(report.copy).toBe("absent");
    expect(files.calls).toEqual(["inspect"]);
  });

  it("reports the files when there is no database at all", () => {
    // Arrange
    const files = fakeFiles({ inventory: found({ database: "missing" }) });

    // Act
    const report = runStorageCheck(files);

    // Assert
    expect(report.copy).toBe("absent");
    expect(files.calls).toEqual(["inspect"]);
  });

  it("takes one copy, reports it, and discards only that copy", () => {
    // Arrange: a database that can be copied and nothing being kept
    const files = fakeFiles({
      inventory: found({ kept: [{ name: "budget-lens.orphan-1.db", format: "foreign" }] }),
    });

    // Act
    const report = runStorageCheck(files);

    // Assert: the copy is reported as it looks on disk, and what is discarded afterwards is the copy the check
    // took — the file the app is keeping is not part of this sequence at all
    expect(report.copy).toBe("own");
    expect(report.inventory.copy).toBe("sqlite");
    expect(files.calls).toEqual(["inspect", "takeCopy", "inspect", "discardOwnCopy"]);
  });

  it("reports a refused copy instead of throwing out of the check", () => {
    // Arrange: a file that looks copyable and is not
    const files = fakeFiles({ inventory: found(), copyOn: "throw" });

    // Act
    const report = runStorageCheck(files);

    // Assert: the screen still gets the files as they are after the attempt, and the failed attempt is cleaned up
    expect(report.copy).toBe("failed");
    expect(report.inventory.copy).toBe("missing");
    expect(files.calls).toEqual(["inspect", "takeCopy", "inspect", "discardOwnCopy"]);
  });
});
