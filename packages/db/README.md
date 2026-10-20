# @budget-lens/db

Drizzle ORM schema and migrations for the on-device SQLite database (#74). The design follows the
[#35 report](https://github.com/alimek/budget-lens-offline/issues/35) as amended by its
[resolution](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802), #40
(`closed_occurrences`) and #124 (current rates only). Versions are drizzle-orm 0.45.4 and drizzle-kit 0.31.11,
pinned exactly. Stay on 0.45.x until the Drizzle 1.0 upgrade gate in #35 §6 is met.

The package is TypeScript source with no build step. It does not open, key or locate the database file: the app
does that (`apps/mobile/src/db/database.ts`; SQLCipher key and cipher guard: #75). Repositories (#81) and the
month-close transaction (#85) are not here yet.

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

## Tests

`pnpm --filter @budget-lens/db test` runs Vitest on Node with sql.js (SQLite in WebAssembly) as the driver, used
only in tests. Covered:

- migrating from an empty database;
- re-running migrations as a no-op;
- a rebuild upgrade that keeps child rows;
- the integrity error;
- the constraints that encode business rules.

The SQLCipher-specific path (key, cipher guard) is covered on devices by #75 and e2e.
