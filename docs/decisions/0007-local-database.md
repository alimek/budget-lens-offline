# 0007 – Local database: expo-sqlite + SQLCipher + Drizzle

Status: Accepted per the #10 research (closed) and its correction comment. Implemented: expo-sqlite with SQLCipher,
Drizzle schema v1 and migrations (#74, [packages/db](../../packages/db/README.md)) and the device key, cipher guard,
encrypted pre-migration copy and recovery screen (#75,
[architecture](../architecture.md#mobile-scaffold-73)). Drizzle on
expo-sqlite with `useLiveQuery` also comes from #1 "Decyzje". Offline scope: [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427).

**Decision.** expo-sqlite with SQLCipher enabled (`useSQLCipher: true` config plugin), Drizzle ORM + drizzle-kit
(latest stable line) for schema and migrations, database key stored in expo-secure-store. op-sqlite is a fallback only.

**Consequences.**
- The app must verify `PRAGMA cipher_version` after opening the database: without SQLCipher in the build,
  `PRAGMA key` silently does nothing and data would be written in plaintext.
- Key and open sequence (#34 §1/§2, #75): 32 random bytes as lowercase hex in expo-secure-store under
  `bl.db.key.v1` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`, no `requireAuthentication`), written and read back before the
  file is created, and used as the raw key `PRAGMA key = "x'<hex>'"`. A new database file always gets a new key.
  `PRAGMA cipher_version` is checked first, `PRAGMA key` is the next operation, and the key is verified by reading
  `sqlite_master`; "database present, key missing" and a wrong key are one recovery state and never delete
  anything, and a SecureStore read that rejects is a retry screen, not "key missing".
- Android Auto Backup and device-to-device transfer exclude the database directory and SecureStore through explicit
  rules (`plugins/withBackupRules.js`, `configureAndroidBackup: false`); the iOS device backup keeps the
  ciphertext-only file (owner review #34).
- `useLiveQuery` is used for simple single-table queries; it ignores joins and re-runs on every row change.
- Scope: No Budget Lens server or accounts; data stays on device; optional backup only via the user's own iCloud /
  Google Drive.
- Open decisions (#10): key and recovery model, details of the encrypted backup/restore epic (#30).
- Migrations (#35, #74): drizzle-kit generates them; they ship as a generated TS module and are applied by
  `runMigrations()` from `packages/db`, not Drizzle's `useMigrations`. The wrapper switches foreign keys off outside
  Drizzle's migration transaction, then runs `PRAGMA foreign_key_check`. Drizzle stays on 0.45.x until the #35 §6
  upgrade gate is met.
