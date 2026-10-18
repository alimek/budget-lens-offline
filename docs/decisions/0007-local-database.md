# 0007 – Local database: expo-sqlite + SQLCipher + Drizzle

Status: Accepted, not implemented yet (#10)

**Decision.** expo-sqlite with SQLCipher enabled (`useSQLCipher: true` config plugin), Drizzle ORM + drizzle-kit
(latest stable line) for schema and migrations, database key stored in expo-secure-store. op-sqlite is a fallback only.

**Consequences.**
- The app must verify `PRAGMA cipher_version` after opening the database: without SQLCipher in the build,
  `PRAGMA key` silently does nothing and data would be written in plaintext.
- `useLiveQuery` is used for simple single-table queries; it ignores joins and re-runs on every row change.
- Open decisions (#10): key and recovery model, MVP sync scope.
