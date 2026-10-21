# @budget-lens/db

Drizzle ORM schema and migrations for the on-device SQLite database (#74). The design follows the
[#35 report](https://github.com/alimek/budget-lens-offline/issues/35) as amended by its
[resolution](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802), #40
(`closed_occurrences`) and #124 (current rates only). Versions are drizzle-orm 0.45.4 and drizzle-kit 0.31.11,
pinned exactly. Stay on 0.45.x until the Drizzle 1.0 upgrade gate in #35 §6 is met.

The package is TypeScript source with no build step. It does not open, key or locate the database file: the app
does that (`apps/mobile/src/db/encrypted-database.ts` opens `budget-lens.db` with `PRAGMA cipher_version`,
`PRAGMA key` and the device key from expo-secure-store). The items and rule-version repository is here (#81,
below); the month-close transaction (#85) is not here yet.

## Schema v1 (`src/schema.ts`)

| Table | Key | Notes |
| --- | --- | --- |
| `items` | `id` | Expenses and incomes, with `kind`. `currency` is required and has no SQL default. `archived_at` archives an item (#81). |
| `item_rule_versions` | `id`, unique `(item_id, effective_from)` | "From this month on" versions (#40). Amount is in the item's currency. One-time XOR recurring shape CHECK. |
| `occurrence_overrides` | `id`, unique `(item_id, month)` | "Only this month". Amount (NULL = rule amount) is in the item's currency. |
| `payment_statuses` | `(item_id, month)` | Row present = paid or received. |
| `months` | `month` | Core `BudgetMonth`. At most one `active` row (partial unique index). Closed rows need `closed_at` and `base_currency`. |
| `closed_occurrences` | `(month, item_id)` | Frozen close snapshot: original amount and currency, rate used (`rate_mid` PLN per unit, `rate_source`, `rate_effective_date`; all NULL for base-currency items) and the base-currency amount. |
| `settings` | `id = 1` (CHECK) | Typed singleton for core `Settings` plus `onboarding_completed_at` (locks `base_currency`, #139). No SQL defaults: `DEFAULT_SETTINGS` in core is the only source. |
| `savings` | `id` | Savings with their own currency. |
| `exchange_rates` | `(currency, source)` | Current rate only, no history. At most one NBP row and one manual row per currency, matching core's `RateStore` contract. |
| `app_meta` | `key` | Small app-level facts. |

Conventions:

- Ids are TEXT UUIDs.
- Money is INTEGER `*_minor`, typed `MinorUnits`.
- Months are TEXT `YYYY-MM` with a CHECK. Timestamps are INTEGER UTC milliseconds from an injected clock.
- Foreign keys use `ON DELETE RESTRICT`: archive, never cascade.
- CHECKs encode invariants only. Lists that may grow (supported currencies, languages) and upper bounds are
  validated in core, so changing them needs no table rebuild.
- CHECK and partial-index SQL references columns **without** the table name (the `c()` helper in the schema).
  drizzle-kit copies that SQL verbatim into `__new_<table>` rebuilds, where `"items"."kind"` fails with "no such
  column". The migration check rejects it.
- No `WITHOUT ROWID` and no `INSERT OR REPLACE`: both bypass the SQLite update hook that live reads use. Use
  `onConflictDoUpdate`.
- The SQL uses only features SQLCipher's SQLite has (CHECK, partial indexes, GLOB). Nothing depends on reading the
  database file directly.

## Migrations

```sh
# after changing src/schema.ts
pnpm --filter @budget-lens/db db:generate --name <slug>
```

This runs `drizzle-kit generate`, which writes `drizzle/<idx>_<slug>.sql` and the `drizzle/meta` snapshot. It then
writes `src/migrations.generated.ts`, a TS module with the `{ journal, migrations }` shape Drizzle's expo migrator
reads. The app needs no Babel inline-import plugin and no `.sql` Metro extension. Commit all three. Never edit
generated files by hand. Drizzle has no down-migrations: roll forward only.

`runMigrationsWithSafetyCopy(db, safetyCopy)` is what the app calls on every start. `safetyCopy` is the caller's
encrypted copy of the database file (the app writes it with `sqlcipher_export` into a database attached with the
same key, #35 §2); this package only decides when each step happens:

- nothing is pending: no copy is taken and a copy left by an earlier launch is discarded, so a copy never outlives
  the migration it protects (#35 Q3: copy whenever migrations are pending, not on every start);
- something is pending: the copy is created first, and any failure – including `MigrationIntegrityError`, which is
  raised after the transaction has committed and so cannot roll itself back – restores it and rethrows, so the app
  can put the file back and show the recovery screen (#75).

`runMigrations(db)` applies pending migrations and returns how many it applied. Use it instead of Drizzle's
`useMigrations`/`migrate`. Drizzle runs all pending migrations in one transaction, and inside a transaction
`PRAGMA foreign_keys` is a no-op, so drizzle-kit's table rebuilds would fail on RESTRICT foreign keys. The wrapper:

1. switches foreign keys off outside the transaction;
2. runs Drizzle's migrator;
3. runs `PRAGMA foreign_key_check` and throws `MigrationIntegrityError` on any violation;
4. always switches foreign keys back on.

Foreign keys are a per-connection setting, so the app uses this one migrated connection for all queries.

`pnpm lint` (and therefore `pnpm check` and CI) runs `db:check` (`scripts/migrations.mjs check`), which fails when:

- `drizzle-kit check` is not clean;
- `src/schema.ts` has changes without a migration (it generates into a scratch copy of `drizzle/`);
- `src/migrations.generated.ts` is out of date;
- journal entries are not numbered in order, or a migration's `when` is not newer than the one before it.
  Drizzle applies only migrations newer than the last applied one
  ([drizzle-orm #5769](https://github.com/drizzle-team/drizzle-orm/issues/5769)), so an older migration merged
  after a newer one would never run on upgraded devices. If this fails after a merge from `main`, delete your
  migration and generate it again;
- a migration has a table-qualified column in a CHECK or index.

Any migration that rebuilds a table (`__new_<table>`) needs a test that seeds rows first; see
`test/migrations.test.ts`.

## Items and rule-version repository (`src/items-repository.ts`, #81)

Rows in, `@budget-lens/core` types out. Picking the version in force per month stays in core
(`versionInForce`, [domain/rule-versions.md](../../docs/domain/rule-versions.md)): the repository never resolves or
merges versions. Core has no id or timestamp on a rule version, so the row-to-core mapping is defined here:

| Column | Core | Notes |
| --- | --- | --- |
| `items.kind` | `itemType` | Fixed after creation (#40). |
| `items.currency` | `currency` | Required `CurrencyCode`, no SQL default (#35 Q5). Created item without a currency → the base currency of the `settings` singleton (#138). Fixed after creation (#81). |
| `items.name`, `note`, `sort_order` | same names | Item-level, never versioned. |
| `items.archived_at` | `archivedAt` | Archive instead of hard delete (#81); archived items are read only with `{ includeArchived: true }`. |
| `effective_from` | `effectiveFrom` | One version per `(item_id, effective_from)`. |
| `amount_minor` | `amount` | Minor units **of the item's currency**: JPY 123 is ¥123 (exponent 0), PLN 123 is 1,23 zł. |
| `interval_months` `NULL` | `schedule.kind: "one-time"` | The month of a one-time schedule is `target_month`. |
| `interval_months >= 1` | `schedule.kind: "recurring"` | `intervalMonths`, `anchor` from `anchor_month`, optional `endMonth` from `end_month`. |
| `day_of_month` | `dayOfMonth` | 1–31; `NULL` is absent. |
| `id`, `created_at` | – | Row metadata; `RuleVersion` in core has neither. New ids come from the injected `newId`. |

Writes take `{ now, newId }` (an injected clock and id source; the repository reads neither the clock nor an RNG)
and return `{ ok } | { ok: false, error }` with codes:

- `createItem` – the item and its versions in one transaction.
- `updateItem` – rename, note and sort order. `currency` and `kind` are accepted only when unchanged: both are
  fixed after creation, so every rule version stays an amount in the item's currency
  ([#81 owner decision](https://github.com/alimek/budget-lens-offline/issues/81#issuecomment-6276228839)).
- `archiveItem` – sets `archived_at` and keeps the item row and every version. Nothing here deletes an item.
- `applyRuleVersionPlan` – the version part of a core `RuleEditPlan` (#80): `upsertVersions` UPSERTed by
  `(item_id, effective_from)` and `deleteVersions` deleted by `effective_from`, in one transaction. What is
  validated is the item's **resulting** version list (kept versions minus the deleted months plus the written
  ones), not the subset the plan writes: a plan can delete versions and write none, and validating the subset would
  reject every `cancel-scheduled` with `no-versions`. When the plan leaves the item with no versions (core's
  `no-versions-left` notice), the item is archived in the same transaction rather than left active with an empty
  rule (#81: archive, never delete). The plan's `upsertOverrides`, `orphanedOverrides` and `resetOverrides` are
  occurrence overrides, which belong to #83: this repository does not write them, so the caller writes or confirms
  them itself. #83 can pass a Drizzle transaction handle and write the versions and the overrides of one plan
  together, as [#40 Q4](https://github.com/alimek/budget-lens-offline/issues/40) expects.

`readItems(db)` returns `{ items, invalidItems }`: every item with its versions in `effectiveFrom` order, plus the
items that were left out and the core error codes that say why (`unsupported-currency`, `invalid-item-type`, or
codes from `validateRuleVersions` and `validateSchedule`). Versions are validated for active items only: a plan that
deletes every version archives its item, and that item's rule is history rather than damage. Like the rate store
(#92) and the versioned resolver
(#80), a malformed row is skipped **and** reported: one damaged row never loses the list and never throws, and #88
filters and reports those items before calling `forecast()`, which fails as a whole on invalid versions.

Live reads (#35 §4): the list is two single-table selects, never a join, and `ITEM_LIST_TABLES` names the tables it
depends on. The app subscribes to `addDatabaseChangeListener` once and re-runs `readItems` when the changed table is
one of those; the hook itself lives in the app, because `addDatabaseChangeListener` and React do too (this package
imports no React). Statements are synchronous Drizzle: microseconds each at this size (#35 §3).

## Tests

`pnpm --filter @budget-lens/db test` runs Vitest on Node with sql.js (SQLite in WebAssembly) as the driver, used
only in tests. sql.js has no SQLCipher, so the safety-copy tests inject a copy of the file bytes instead and cover
only the decisions above. Covered:

- migrating from an empty database;
- re-running migrations as a no-op;
- a rebuild upgrade that keeps child rows;
- the integrity error;
- the encrypted pre-migration copy: no copy while the schema is current (a leftover one is discarded), a copy on
  the launch that has migrations, and the data back in place after a failing statement or a committed migration
  that leaves rows without their parent (`test/migration-copy.test.ts`);
- the constraints that encode business rules.

`test/items-repository.test.ts` covers the repository's business rules: the base-currency default and whole minor
units, the currency that cannot change, archiving instead of deleting, both schedule shapes round-tripping through
the columns, several versions of one item resolving per month, a damaged row being reported instead of dropped, a
`cancel-scheduled` plan that writes no versions, and the item a plan empties being archived.

The SQLCipher-specific path (key, cipher guard, a copy that is really ciphertext) is covered on devices by e2e
(#75).
