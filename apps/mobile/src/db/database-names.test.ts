import { describe, expect, it } from "vitest";
import {
  asideNames,
  COPY_NAME,
  DATABASE_NAME,
  fileNamesOf,
  isBudgetFile,
  isOrphanName,
  orphanName,
  RESTORE_NAME,
  sideFileNames,
} from "./database-names";

describe("side file names", () => {
  it("covers the rollback journal a transaction leaves behind (#75 R5)", () => {
    // Arrange / Act
    const names = sideFileNames(DATABASE_NAME);

    // Assert
    expect(names).toEqual(["budget-lens.db-journal", "budget-lens.db-wal", "budget-lens.db-shm"]);
  });
});

describe("asideNames", () => {
  it("renames a kept database together with every side file of it", () => {
    // Arrange
    const stamp = 1_730_000_000_000;

    // Act
    const moves = asideNames({ stamp, database: true, copy: true, restoring: true });
    const orphan = orphanName(stamp);

    // Assert: the journal moves with the file instead of waiting for the fresh database under its old name
    expect(moves.map((move) => move.to)).toEqual([
      orphan,
      `${orphan}-journal`,
      `${orphan}-wal`,
      `${orphan}-shm`,
      `${orphan}.${COPY_NAME}`,
      `${orphan}.${COPY_NAME}-journal`,
      `${orphan}.${COPY_NAME}-wal`,
      `${orphan}.${COPY_NAME}-shm`,
      `${orphan}.${RESTORE_NAME}`,
      `${orphan}.${RESTORE_NAME}-journal`,
      `${orphan}.${RESTORE_NAME}-wal`,
      `${orphan}.${RESTORE_NAME}-shm`,
    ]);
    // Every name the fresh database is about to take is empty afterwards, journal included.
    const live = new Set([
      ...fileNamesOf(DATABASE_NAME),
      ...fileNamesOf(COPY_NAME),
      ...fileNamesOf(RESTORE_NAME),
    ]);
    expect(moves.some((move) => live.has(move.to))).toBe(false);
  });

  it("moves only the files that are actually there", () => {
    // Arrange / Act
    const onlyCopy = asideNames({ stamp: 1, database: false, copy: true, restoring: false });

    // Assert
    expect(onlyCopy.map((move) => move.from)).toEqual(fileNamesOf(COPY_NAME));
    expect(isOrphanName(orphanName(42))).toBe(true);
    expect(isOrphanName(DATABASE_NAME)).toBe(false);
    expect(isBudgetFile(`${orphanName(42)}.${COPY_NAME}-journal`)).toBe(true);
    expect(isBudgetFile("some-other-app.db")).toBe(false);
  });
});
