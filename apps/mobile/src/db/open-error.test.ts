import { describe, expect, it } from "vitest";
import { classifyKeyReadError } from "./open-error";

describe("classifyKeyReadError", () => {
  it("reads an unreadable file as a key that does not open it (#75 R3)", () => {
    // Arrange
    const wrongKey = new Error("file is not a database (SQLITE_NOTADB)");

    // Act
    const failure = classifyKeyReadError(wrongKey);

    // Assert
    expect(failure).toBe("key_missing");
  });

  it("reads a busy or failing device as something to retry, never as a missing key (#75 R3)", () => {
    // Arrange
    const busy = new Error("database is locked");
    const diskFull = new Error("disk I/O error");
    const wrapped = new Error("Failed to read", {
      cause: new Error("database disk image is malformed"),
    });
    const withCode = { code: 5, message: "database is locked" };

    // Act / Assert
    expect(classifyKeyReadError(busy)).toBe("storage_unreachable");
    expect(classifyKeyReadError(diskFull)).toBe("storage_unreachable");
    expect(classifyKeyReadError(wrapped)).toBe("storage_unreachable");
    expect(classifyKeyReadError(withCode)).toBe("storage_unreachable");
  });

  it("follows the cause chain to the message that decides", () => {
    // Arrange
    const wrapped = new Error("SQLite operation failed", {
      cause: new Error("file is not a database"),
    });

    // Act / Assert
    expect(classifyKeyReadError(wrapped)).toBe("key_missing");
  });
});
