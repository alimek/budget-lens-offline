/**
 * What a failed first read of a keyed database means. Only "this is not a database" says anything about the key:
 * SQLCipher decrypts lazily, so a wrong key or a plaintext file shows up as an unreadable file, while a busy or
 * failing device says something else and must never lead the user towards throwing a budget away (#75 R3).
 */
export type KeyReadFailure = "key_missing" | "storage_unreachable";

// SQLite's own message for a file it cannot recognise as a database, and the name of its result code
// (`SQLITE_NOTADB`, 26). SQLCipher reports a wrong key exactly this way.
const NOT_A_DATABASE = /file is not a database|sqlite_notadb/i;

/** The message, code and cause chain of anything Expo SQLite may throw. */
function describe(error: unknown): string {
  const seen = new Set<unknown>();
  const parts: string[] = [];
  let current: unknown = error;
  while (typeof current === "object" && current !== null && !seen.has(current)) {
    seen.add(current);
    const record = current as { message?: unknown; code?: unknown; cause?: unknown };
    if (typeof record.message === "string") {
      parts.push(record.message);
    }
    if (record.code !== undefined) {
      parts.push(String(record.code));
    }
    current = record.cause;
  }
  return parts.join(" ");
}

/** Whether a database that was keyed with the stored key can be opened with it. */
export function classifyKeyReadError(error: unknown): KeyReadFailure {
  return NOT_A_DATABASE.test(describe(error)) ? "key_missing" : "storage_unreachable";
}
