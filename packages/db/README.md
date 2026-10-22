# @budget-lens/db

Drizzle ORM schema and migrations for the on-device SQLite database (#74). The design follows the
[#35 report](https://github.com/alimek/budget-lens-offline/issues/35) as amended by its
[resolution](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802), #40
(`closed_occurrences`) and #124 (current rates only). Versions are drizzle-orm 0.45.4 and drizzle-kit 0.31.11,
pinned exactly. Stay on 0.45.x until the Drizzle 1.0 upgrade gate in #35 §6 is met.

The package is TypeScript source with no build step. It does not open or locate the database file: the app does
that (`apps/mobile/src/db/database.ts` opens `budget-lens.db` with expo-sqlite, plain SQLite with no key and no
app-level encryption, [#242](https://github.com/alimek/budget-lens-offline/issues/242)). The items and rule-version
repository is here (#81,
below), with the occurrence override and payment status repository (#83); the month-close transaction (#85) is not
here yet.

## Schema v1 (`src/schema.ts`)

| Table | Key | Notes |
| --- | --- | --- |
| `items` | `id` | Expenses and incomes, with `kind`. `currency` is required and has no SQL default. `archived_at` archives an item (#81). |
| `item_rule_versions` | `id`, unique `(item_id, effective_from)` | "From this month on" versions (#40). Amount is in the item's currency. One-time XOR recurring shape CHECK. |
| `occurrence_overrides` | `id`, unique `(item_id, month)` | "Only this month". Amount (NULL = rule amount) is in the item's currency. `overrides_shape_chk` keeps exactly one of an amount or a skip (#83, migration 0001). |
| `payment_statuses` | `(item_id, month)` | Row present = paid or received. Written by #83 (below). |
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
- The SQL uses only features of the SQLite expo-sqlite ships (CHECK, partial indexes, GLOB). Nothing depends on
  reading the database file directly.

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
copy of the database file (the app writes it with SQLite's own backup, `backupDatabaseSync`, so the copy is
consistent even while the connection is open, #35 §2); this package only decides when each step happens:

- nothing is pending: no copy is taken and a copy left by an earlier launch is discarded, so a copy never outlives
  the migration it protects (#35 Q3: copy whenever migrations are pending, not on every start);
- something is pending: the copy is created first – unless an earlier launch is already keeping one, because the
  older state is the more valuable one and is never replaced (#75 R1) – and any failure, including
  `MigrationIntegrityError` (raised after the transaction has committed and so cannot roll itself back), restores
  it and rethrows, so the app can put the file back and show the recovery screen (#75);
- putting the copy back fails: that error is what the caller sees, in place of the migration error. The copy stays
  where it is: it is the only intact state left, the app must not discard or replace it, and its recovery screen may
  not claim the database was restored (#75 R1). A database this build cannot open at all — the plain file of an
  older encrypted install (#242), a truncated file — never reaches this wrapper: the app shows the recovery screen
  before migrating, and there the file is only ever renamed, never deleted.

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

### Migration 0001 (`0001_override_shape_check`)

It rebuilds `occurrence_overrides` to add `overrides_shape_chk`, the SQL form of core's rule that an override is
exactly one of an amount and a skip. The rebuild copies every row into the new table, so a v1 row with neither
(`amount_minor` NULL and `skipped` 0, core's `empty-override`) or with both (core's `skipped-with-amount`) fails the
`INSERT INTO __new_occurrence_overrides` and the migration throws. That hard failure is deliberate: no shipped
database can hold such a row. Schema v1 shipped in TestFlight build 6, but no build before #83 ever wrote
`occurrence_overrides`; since #83 the only writer is this repository, behind core's shape validation and now the
CHECK; and there is no backup restore yet. If a row like that ever appears, the user loses nothing they had: the
transaction rolls back, `runMigrationsWithSafetyCopy` restores the pre-migration copy, and the boot shows the
recovery screen (#75, #210). Anything that writes overrides from outside this repository later
(encrypted backup restore, #30; an import) must validate the shape with core before writing, or rely on the CHECK to
reject it. `test/migrations.test.ts` pins both the rebuild of valid rows and this failure path.

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
  occurrence overrides, which belong to #83: this repository does not write them, so a caller that only edits the
  rule uses `applyRuleVersionPlan`. `applyRulePlan` below writes the versions and the overrides of one plan in one
  transaction, as [#40 Q4](https://github.com/alimek/budget-lens-offline/issues/40) expects, reusing the two helpers
  this function is built from (`ruleVersionPlanError`, `writeRuleVersions`).

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

## Months repository (`src/months-repository.ts`, #112)

One fact for now: which month is active. Month closing (#85) owns everything else about a month row, so this
repository computes no balances and opens or closes nothing.

- `readActiveMonth(db)` returns the `month` of the single `status = 'active'` row (the partial unique index keeps it
  to one) as a core `YearMonth`, or `undefined` while no month has been opened. Onboarding (#111) creates the first
  row, so a database written before it has none and the app falls back to the device's calendar month
  (`apps/mobile/src/db/active-month.ts`).
- `MONTH_TABLES` names the table that read depends on, the way `ITEM_LIST_TABLES` and `SETTINGS_TABLES` do, so the
  app's live-read hook re-runs it when the row appears.

## Settings repository (`src/settings-repository.ts`, #78)

The `settings` singleton in, core `Settings` out. What is a valid settings value stays core's decision
([domain/settings.md](../../docs/domain/settings.md)): nothing here validates a field of its own.

| Column | Core | Notes |
| --- | --- | --- |
| `language` | `language` | `system`, `pl` or `en`. |
| `base_currency` | `baseCurrency` | Written only by a patch that names it, and locked after onboarding confirmation (#139, not implemented). |
| `tracked_currencies` | `trackedCurrencies` | Read as raw JSON text: a damaged list cannot throw while Drizzle maps the row. |
| `low_balance_threshold_minor`, `large_expense_threshold_minor` | `lowBalanceThreshold`, `largeExpenseThreshold` | Grosze of `base_currency`. |
| `forecast_horizon_months`, `rate_max_age_business_days` | same names | Upper bounds are core's (`MAX_*`), not SQL CHECKs. |
| `onboarding_completed_at` | – | Owned by #139: this repository never writes it and an update keeps its value. |
| `id`, `updated_at` | – | `id` is the singleton CHECK's `1`; `updated_at` comes from the injected `now`. |

- `readSettings(db)` maps the row to core field names and passes it through `loadSettings`, so a missing or invalid
  field reads as its `DEFAULT_SETTINGS` value and a damaged row is repaired on read instead of throwing. A database
  with no row – a fresh install – reads as `DEFAULT_SETTINGS`. **Reads never write**: the row appears with the first
  `updateStoredSettings`, which in practice is the onboarding confirmation writing the chosen base currency
  (#111/#139) rather than a seed at launch; `updateStoredSettings(db, {}, deps)` would store the defaults.
- `updateStoredSettings(db, patch, { now })` runs the patch through core `updateSettings`. An invalid patch returns
  core's error codes and writes nothing; a valid one UPSERTs the singleton (`onConflictDoUpdate`, never
  `INSERT OR REPLACE`) with `updated_at` from the injected clock, and returns the settings now stored.
- **`base_currency` is never healed.** Every amount in the budget is in it, so the UPSERT writes it only when the
  patch names `baseCurrency`, and an unrelated change never restates it. If a stored code is one core no longer
  recognises (a currency that left NBP table A, or a damaged row), the whole write is refused with
  `stored-base-currency-invalid` and nothing is written, rather than the default being persisted over it; reads
  still fall back to `DEFAULT_SETTINGS` per field.

- This is the only writer of the singleton, which is where #139 will reject a `baseCurrency` patch once onboarding
  is confirmed.

Live reads again: `SETTINGS_TABLES` names the table `readSettings` depends on, so an app hook can re-read the
settings on a change the same way it re-reads the item list.

## Occurrence override and payment status repository (`src/occurrences-repository.ts`, #83)

`occurrence_overrides` and `payment_statuses` rows in, `@budget-lens/core` types out. What an override is, which
occurrence it applies to and which months are closed stay in core
([domain/occurrence-overrides.md](../../docs/domain/occurrence-overrides.md),
[domain/month-closing.md](../../docs/domain/month-closing.md)): nothing here decides them of its own. There is no
`item_type` column: the key is `(item_id, month)` and the type comes from `items.kind` (#35 Q1), so an override read
is two single-table selects and no join. An amount is never converted here and a month is never a date: an override
is in the currency of the item it overrides (#138), months are `YYYY-MM` text with no time zone, and timestamps are
UTC milliseconds from the injected clock.

| Column | Core | Notes |
| --- | --- | --- |
| `occurrence_overrides.item_id` + `month` | `itemId`, `month` | The key of one occurrence; `id` is the row's own. |
| `items.kind` (a separate select) | `itemType` | There is no `item_type` column (#35 Q1). |
| `amount_minor` | `amount` | Minor units of the **item's** currency (#138); NULL is absent, never 0. |
| `skipped` | `skipped` | `false` is absent in core's model, not a field with a value. |
| `note` | `note` | NULL is absent. |
| a `payment_statuses` row | `PaymentStatus` with `settled: true` | Unsettled is the absence of a row (#35 Q4). |
| `id`, `created_at`, `updated_at`, `settled_at` | – | Row metadata; ids and timestamps come from the injected `newId` and `now`. |

Reads:

- `readOverrides(db, { months? })` maps rows to core `OccurrenceOverride`s. Like `readItems`, a row core rejects – or
  whose `items` row is gone – is **skipped and reported** in `rejectedOverrides` with its codes (`unknown-item` for
  the missing item, core's codes otherwise), never thrown. Without `months`, every month is read.
- `readPaymentStatuses(db, { months? })` gives core `PaymentStatus`es with `settled: true`. Payment status is
  independent of currency (#39): the item carries its own.
- `readMonthOccurrences(db, month)` is one **open** month for the month view (#114) and for closing (#84): the
  active items of `readItems`, the overrides and the payment statuses of that month, through core's
  `resolveVersionedOccurrences` (#80). Each occurrence carries the item's `currency`, its effective `amount`, its
  `override` when it has one, and `settled`. A skipped occurrence is absent and keeps its payment row, which applies
  again when the skip is cleared. **A closed month is read from its `closed_occurrences` snapshot instead**
  (#85/#86), never resolved again from the live rule (#40 Q3).
- For the app's live hook, `OVERRIDE_TABLES`, `PAYMENT_STATUS_TABLES` and `MONTH_OCCURRENCES_TABLES` name the tables
  each read depends on, as `ITEM_LIST_TABLES` does for the item list.

Writes take `deps: { now, newId }` and an explicit `{ activeMonth }` context – core's `RuleEditContext`, which the
caller reads from the `months` table and never from a clock (the months repository is #112) – and return
`{ ok } | { ok: false, error: { code } }`:

- `setOverride(db, { itemId, month, amount? | skipped?, note? }, context, deps)` – "only this month", core's
  `only-month`. Core validates it (`validateOverride`) against the item's version in force for that month, so an
  unknown item (`item-not-found`), an archived one (`item-archived`), a damaged one (`invalid-item`), a one-time
  item (`one-time-item`), a month with no occurrence (`inactive-month`) and a shape that is not an override
  (`empty-override`, `skipped-with-amount`) all write nothing. Then it UPSERTs `(item_id, month)`: a second edit of
  the same occurrence replaces the first, keeps the row id and `created_at`, and stamps `updated_at`. The override's
  own `note` replaces the stored one: an edit replaces the whole override.
- `clearOverride(db, itemId, month, context)` – back to the rule amount. It never touches the payment row.
- `settleOccurrence(db, itemId, month, context, deps)` / `unsettleOccurrence(db, itemId, month, context)` – insert
  the payment row (idempotent: a second call keeps the first `settled_at`) or delete it. The deletes take no `deps`:
  they stamp nothing. A payment status is per item and month and independent of the rule, so an item can be settled
  for a month its rule does not schedule: the row is a fact the month view and closing use, and #114 decides what to
  show for it.
- `applyRulePlan(db, itemId, plan, context, deps)` – a whole core `RuleEditPlan` in **one transaction**: the versions
  exactly as `applyRuleVersionPlan` applies them, the `upsertOverrides` UPSERTed, and the `orphanedOverrides` plus
  `resetOverrides` deleted (#40 Q4). `keptOverrides` are left untouched: an override of a later month keeps its own
  amount or skip unless the plan resets it (#40 Q5). A plan never writes or deletes a payment row: an edit changes
  the rule, not what was paid. When anything is refused, or a write fails, nothing is written.

**Closed months are immutable.** Every write above, and every delete including a plan's, is refused with
`month-closed` and writes nothing when the month is before `activeMonth` (core's `planRuleEdit` rule) or its `months`
row has `status = 'closed'` (core's `validateMonthEditable`): the same policy those two express, in the same code,
read from the caller's context and the `months` table rather than from a clock. An invalid `month` or `activeMonth`
is `invalid-month`.

## Tests

`pnpm --filter @budget-lens/db test` runs Vitest on Node with sql.js (SQLite in WebAssembly) as the driver, used
only in tests, and it has no files, so the safety-copy tests inject a copy of the file bytes instead and cover only
the decisions above. Covered:

- migrating from an empty database;
- re-running migrations as a no-op;
- a rebuild upgrade that keeps child rows;
- the integrity error;
- the pre-migration copy: no copy while the schema is current (a leftover one is discarded), a copy on
  the launch that has migrations, the data back in place after a failing statement or a committed migration that
  leaves rows without their parent, and a failed restore that keeps the copy where it is and reports its own error
  instead of the migration's (`test/migration-copy.test.ts`);
- the constraints that encode business rules.

`test/items-repository.test.ts` covers the repository's business rules: the base-currency default and whole minor
units, the currency that cannot change, archiving instead of deleting, both schedule shapes round-tripping through
the columns, several versions of one item resolving per month, a damaged row being reported instead of dropped, a
`cancel-scheduled` plan that writes no versions, and the item a plan empties being archived.

`test/months-repository.test.ts` covers the one fact: no month row and no active row both read as no active month, the active row is read, a closed month is not the active one, and an active row is found among closed ones.

`test/settings-repository.test.ts` covers the settings rules: the defaults of a database with no row (and that a
read writes nothing), a first write that stores the defaults a patch completes with amounts as whole grosze, core's
error codes with the row untouched on an invalid patch, a damaged field falling back to its default while the valid
ones survive, the onboarding timestamp an update keeps, and the base currency: kept through an unrelated write,
stored when a patch asks for it, and the whole write refused when the stored code is unreadable.

`test/occurrences-repository.test.ts` covers the override and payment rules: setting one occurrence twice keeps one
row with the last amount and the first `created_at`; overrides of a PLN and of a JPY item stay whole minor units of
their own currency; a one-time item and a month without an occurrence are refused; a damaged row is reported rather
than dropped or thrown; settling twice keeps the first `settled_at`; a skipped occurrence disappears while its
payment row survives and returns with it; an override stays keyed by its month across a rule-version change and a
year rollover; a plan that ends a recurrence deletes its orphaned overrides and keeps (or, when it resets them,
deletes) the later ones; a refused plan writes neither versions nor overrides; every closed-month write is refused
and writes nothing; and `forecast()` reaches the totals it should from what these reads return.
`test/migrations.test.ts` upgrades a database that already holds overrides of both valid shapes and payment rows
through the 0001 rebuild, with `foreign_key_check` clean and the shape CHECK refusing an amount with a skip, and
neither of them, afterwards.

The file-level path (opening the plain database, a copy that is really a file, an unreadable database leading to the
one recovery screen, and a "start over" that keeps the file) is covered on devices by e2e (#75, #242). There is
deliberately no migration from the encrypted databases of older builds: an install updating from one starts with an
empty budget after the recovery screen, with its encrypted file renamed aside and unreadable by this build
([ADR 0007](../../docs/decisions/0007-local-database.md)).
