# 0007 – Local database: expo-sqlite + SQLCipher + Drizzle

Status: Accepted per the #10 research (closed) and its correction comment. Partly implemented: expo-sqlite,
Drizzle schema v1 and migrations (#74, [packages/db](../../packages/db/README.md)); SQLCipher, the key and the cipher
guard are #75. Drizzle on
expo-sqlite with `useLiveQuery` also comes from #1 "Decyzje". Offline scope: [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427).

**Decision.** expo-sqlite with SQLCipher enabled (`useSQLCipher: true` config plugin), Drizzle ORM + drizzle-kit
(latest stable line) for schema and migrations, database key stored in expo-secure-store. op-sqlite is a fallback only.

**Consequences.**
- The app must verify `PRAGMA cipher_version` after opening the database: without SQLCipher in the build,
  `PRAGMA key` silently does nothing and data would be written in plaintext.
- `useLiveQuery` is used for simple single-table queries; it ignores joins and re-runs on every row change.
- Scope: No Budget Lens server or accounts; data stays on device; optional backup only via the user's own iCloud /
  Google Drive.
- Open decisions (#10): key and recovery model, details of the encrypted backup/restore epic (#30).
- Migrations (#35, #74): drizzle-kit generates them; they ship as a generated TS module and are applied by
  `runMigrations()` from `packages/db`, not Drizzle's `useMigrations`. The wrapper switches foreign keys off outside
  Drizzle's migration transaction, then runs `PRAGMA foreign_key_check`. Drizzle stays on 0.45.x until the #35 §6
  upgrade gate is met.
