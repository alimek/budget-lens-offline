import { describe, expect, it } from "vitest";
import { type BootFiles, mayWriteKey, planBoot } from "./boot-plan";

const files = (over: Partial<BootFiles> = {}): BootFiles => ({
  database: false,
  copy: false,
  restoring: false,
  orphan: false,
  key: false,
  ...over,
});

describe("planBoot", () => {
  it("opens the database of a normal launch", () => {
    // Arrange
    const normal = files({ database: true, key: true, copy: true });

    // Act
    const plan = planBoot(normal);

    // Assert: the copy of a migration that went well is still there, and the live file outranks it
    expect(plan).toBe("open_database");
  });

  it("writes a key only when nothing of a budget is on the device", () => {
    // Arrange
    const firstLaunch = files();
    const reinstalled = files({ key: true });

    // Act / Assert: a leftover Keychain item with no files is the reinstall case of #34 §1
    expect(planBoot(firstLaunch)).toBe("fresh_database");
    expect(planBoot(reinstalled)).toBe("fresh_database");
  });

  it("finishes an interrupted restore instead of creating anything (#75 R1)", () => {
    // Arrange
    const staged = files({ restoring: true, key: true });
    const copyOnly = files({ copy: true, key: true });

    // Act / Assert: no key is generated and no empty database is created over them
    expect(planBoot(staged)).toBe("finish_restore");
    expect(planBoot(copyOnly)).toBe("finish_restore");
  });

  it("keeps a key that may still belong to a file it is holding (#75 R2)", () => {
    // Arrange
    const orphanWithKey = files({ orphan: true, key: true });

    // Act
    const plan = planBoot(orphanWithKey);

    // Assert: an unknown state, not a first launch: recovery instead of a new key
    expect(plan).toBe("protect_existing_files");
    // Without the key there is nothing left to protect, and a new budget may start
    expect(planBoot(files({ orphan: true }))).toBe("fresh_database");
  });

  it("allows a new key only while no file of a budget is on the device (#75 R2)", () => {
    // Arrange / Act / Assert
    expect(mayWriteKey(files())).toBe(true);
    expect(mayWriteKey(files({ key: true }))).toBe(true);
    expect(mayWriteKey(files({ database: true }))).toBe(false);
    expect(mayWriteKey(files({ copy: true }))).toBe(false);
    expect(mayWriteKey(files({ restoring: true }))).toBe(false);
    expect(mayWriteKey(files({ orphan: true }))).toBe(false);
  });
});
