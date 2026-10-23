# 0007 – Local database: plain expo-sqlite + Drizzle

Status: Superseded by [#242](https://github.com/alimek/budget-lens-offline/issues/242) (2026-10-22) for the
encryption part; expo-sqlite + Drizzle stands. The owner first accepted it per the #10 research (closed) and its
correction comment, and it was implemented as expo-sqlite with SQLCipher, Drizzle schema v1 and migrations (#74,
[packages/db](../../packages/db/README.md)) plus the device key, cipher guard, encrypted pre-migration copy and
recovery screens (#75, [architecture](../architecture.md#mobile-scaffold-73)). Drizzle on
expo-sqlite with `useLiveQuery` also comes from #1 "Decyzje". Offline scope: [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427).

**Superseded by #242 — what replaced it.** The database is plain SQLite: `useSQLCipher` is off, there is no database
key and no app-level encryption, and the recovery path is one screen. The owner's answer of 2026-10-22
([decisions](../decisions.md)) is to keep the data in "zwykły SQLite bez własnego szyfrowania" and simplify the
recovery screens; privacy rests on the app sandbox and the OS's own data protection, and the app no longer has a key
whose loss can make a budget unreadable. Everything below is the record of the encryption decision as it stood.

**Decision (as recorded here; the SQLCipher part is superseded by #242).** expo-sqlite with SQLCipher enabled
(`useSQLCipher: true` config plugin), Drizzle ORM + drizzle-kit (latest stable line) for schema and migrations,
database key stored in expo-secure-store. op-sqlite is a fallback only. **Still in force:** expo-sqlite + Drizzle for
schema and migrations, and op-sqlite as a fallback only.

**Consequences.**
- Superseded by #242: verifying `PRAGMA cipher_version` after opening the database, and the whole key sequence of
  #34 §1/§2 and #75 (32 random bytes in expo-secure-store under `bl.db.key.v1`, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`,
  written before the file is created, used as `PRAGMA key = "x'<hex>'"`, checked by reading `sqlite_master`, with
  "database present, key missing" and a wrong key as one recovery state and a rejected SecureStore read as a retry
  screen). None of it exists in the app any more.
- Still in force: Android Auto Backup and device-to-device transfer exclude the database directory through explicit
  rules (`plugins/withBackupRules.js`), and the iOS device backup keeps the file inside the app sandbox (owner
  review #34).
- **Data loss on the upgrade away from encryption (#242).** There is no migration path: an install updating from a
  SQLCipher build cannot open its own file (the key is no longer stored), so it sees the recovery screen, and
  "Start over" renames that file aside and starts an **empty budget**. The file is kept on the device for support and
  for E8, but this build cannot read it. The owner accepted losing that data rather than keeping key handling alive
  for one upgrade ([decisions](../decisions.md)).
- `useLiveQuery` is used for simple single-table queries; it ignores joins and re-runs on every row change.
- Scope: No Budget Lens server or accounts; data stays on device; optional backup only via the user's own iCloud /
  Google Drive.
- Open decisions (#10): details of the encrypted backup/restore epic (#30) — the one place where encryption returns.
- Migrations (#35, #74): drizzle-kit generates them; they ship as a generated TS module and are applied by
  `runMigrations()` from `packages/db`, not Drizzle's `useMigrations`. The wrapper switches foreign keys off outside
  Drizzle's migration transaction, then runs `PRAGMA foreign_key_check`. Drizzle stays on 0.45.x until the #35 §6
  upgrade gate is met. Before a migration the app still keeps a copy of the database file (#35 Q3) — plain, not
  encrypted — and puts it back if the migration fails (#75 R1).
