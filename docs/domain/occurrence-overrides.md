# Occurrence overrides

Status: **implemented** in `packages/core/src/occurrence-overrides.ts` (#5). The database table is a sketch for
Stage 1 (`packages/db` does not exist yet).

## Model

An `OccurrenceOverride` changes **one occurrence of one recurring item in one month**:

```ts
{ id, itemType: "expense" | "income", itemId, month: YearMonth, amount?: MinorUnits, skipped?: boolean, note? }
```

- Override amounts use the item's own currency; closing converts the effective occurrence into the locked base
  currency and snapshots the rate ([month-closing.md](month-closing.md), #84).
- Either `amount` (the occurrence uses this amount instead of the item's) or `skipped: true` (the occurrence is left
  out). Unique per `(itemType, itemId, month)`.
- `amount` is `MinorUnits` and **≥ 0**: expenses and incomes are separate item types, so a refund is an income, not a
  negative expense. `amount: 0` keeps the occurrence (with 0, it can still be marked paid); `skipped` removes it, so
  there is nothing to pay. An override with the item's own amount is valid but a no-op; the UI can delete it instead.
- Only occurrences of **recurring** items are overridden. A one-time item is edited directly (`one-time-item`). A
  stored override of a one-time item (from a backup, or after the item's rule changed from recurring to one-time) is
  never applied.
- Items are matched by `(itemType, itemId)` only – **never by name**. Renaming an item or having two items with the
  same name does not affect overrides.
- "From this month on" is **not** an override: it is a change of the item's rule (rule versioning, #80), so past
  months keep their amounts. An override only ever changes its own month.
- Payment status stays per item and month (`payment_status`, legacy `004_create_payment_status.sql`): a resolved
  occurrence carries `item` and `month`, which is the key of its payment status. A skipped occurrence has nothing to
  pay; an existing payment-status row of that month is kept but not shown, and applies again if the skip is removed.

## Functions

- `resolveOccurrences(items, overrides, month)` – the effective occurrences of `ScheduledItem`s
  (`{ id, itemType, amount, schedule }`) in `month`, in item order, as
  `{ occurrences, rejectedOverrides, invalidItems }`. Each occurrence is `{ item, month, day?, amount, override? }`,
  with overridden amounts applied and skipped occurrences removed.
  - Bad stored data never breaks the month. An override that fails `validateStoredOverride` or shares
    `(itemType, itemId, month)` with another override (every copy, none is applied) is left out and reported in
    `rejectedOverrides` with its error codes. An item with an invalid schedule (`validateSchedule`, e.g.
    `schedule: null`) is left out and reported in `invalidItems`.
  - Items themselves (`id`, `itemType`, `amount`) are not validated here: the items storage (epic E3) must validate
    them when they are loaded, before `resolveOccurrences`.
  - `rejectedOverrides` is the same for every month of the same input, so the caller reports it once per load.
- `findOrphanedOverrides(items, overrides)` – valid overrides that resolving does not apply: `unknown-item` (e.g. the
  item was deleted), `one-time-item` (the item is a one-time item, e.g. after a rule change from recurring to
  one-time) or `no-occurrence` (the item has no occurrence in that month, e.g. after a new end month, anchor or
  interval). A valid override of a one-time item is reported here only, not in `rejectedOverrides`.
- `validateStoredOverride(value)` – runtime check of an override from storage or a backup; never throws. `null`
  optional fields count as absent.
- `validateOverride(override, item)` – the same checks plus the item checks, for user input; never throws, also for
  an item with an invalid schedule.

**Decision (#5): orphaned overrides.** Resolving **ignores** an override without an occurrence, but it is never
dropped silently: `findOrphanedOverrides` finds them, so an edit flow can warn before a rule change ("this change
removes N month adjustments") and delete them in the same transaction as the rule change (left in the database, they
would silently come back if the rule changed back). Loading and backup restore count them locally (no telemetry).

**Decision (#5): duplicates.** When several stored overrides share `(itemType, itemId, month)`, **none is applied
and all are reported** (`duplicate-override`). The model has no `updatedAt` and SQLite row order is not guaranteed, so
"newest wins" would really be arbitrary and would hide the problem. This rule stays as a defensive safeguard; storage
(#74) keeps duplicates from being written at all (see the requirements below the table sketch). The month view must
show a "conflicting adjustments, choose one" state for the rejected duplicates of that month (filter
`rejectedOverrides` by `month`); resolving it deletes the other copies.

### Error codes

| Code | Meaning |
| --- | --- |
| `invalid-override` | The stored value is not an object (e.g. a `null` row). |
| `invalid-id`, `invalid-item-id` | `id` / `itemId` is not a non-empty string. |
| `invalid-item-type` | `itemType` is not `"expense"` or `"income"`. |
| `invalid-month` | `month` is not a valid `YYYY-MM` (e.g. `"2026-13"`, `"2026-1"`). |
| `invalid-amount` | `amount` is present but not `MinorUnits` ≥ 0 (e.g. `1.5`, `-5000`, `"320000"`). |
| `invalid-skipped` | `skipped` is present but not a boolean (e.g. `1`, `"true"`; the database layer maps booleans). |
| `invalid-note` | `note` is present but not a string. |
| `empty-override` | Neither an amount nor `skipped: true`. |
| `skipped-with-amount` | Both an amount and `skipped: true`. |
| `duplicate-override` | Another override has the same `(itemType, itemId, month)` (`resolveOccurrences` only). |
| `item-mismatch` | `itemType` / `itemId` is not the item's (`validateOverride` only). |
| `one-time-item` | The item is a one-time item (`validateOverride`, orphan reason). |
| `invalid-schedule` | The item's schedule is invalid (`validateOverride` only). |
| `inactive-month` | The item has no occurrence in that month (`validateOverride` only). |

## Table sketch (Drizzle, `expo-sqlite`) – Stage 1 (#74)

```ts
export const occurrenceOverrides = sqliteTable(
  "occurrence_overrides",
  {
    id: text("id").primaryKey(),
    itemType: text("item_type", { enum: ["expense", "income"] }).notNull(),
    itemId: text("item_id").notNull(),
    month: text("month").notNull(), // YYYY-MM
    amount: integer("amount"), // minor units; null when skipped
    skipped: integer("skipped", { mode: "boolean" }).notNull().default(false),
    note: text("note"),
  },
  (table) => [
    uniqueIndex("occurrence_overrides_item_month").on(table.itemType, table.itemId, table.month),
    check("occurrence_overrides_amount_or_skip", sql`(${table.amount} IS NULL) = (${table.skipped} = 1)`),
    check("occurrence_overrides_amount_non_negative", sql`${table.amount} >= 0`),
    check(
      "occurrence_overrides_month_format",
      sql`${table.month} GLOB '[0-9][0-9][0-9][0-9]-0[1-9]' OR ${table.month} GLOB '[0-9][0-9][0-9][0-9]-1[0-2]'`,
    ),
  ],
);
```

`itemId` points to an expense or an income depending on `itemType`, so there is no foreign key; deleting an item
deletes its overrides in the same transaction.

Requirements for #74:
- The unique index on `(itemType, itemId, month)` (`occurrence_overrides_item_month`) is **mandatory**, so duplicates
  cannot exist in SQLite.
- Overrides are written as **upserts** (`INSERT … ON CONFLICT (item_type, item_id, month) DO UPDATE`), so a second
  edit of the same occurrence replaces the first one instead of conflicting.
- Restore from a backup (#48) validates the overrides and **deduplicates them before inserting** (otherwise the unique
  index would abort the restore transaction), e.g. by asking the user or by keeping the newer backup's row.

## Legacy data

Legacy data is **not imported** (owner decision): there is no migration of the legacy name-based overrides.
`test/occurrence-overrides.characterization.test.ts` checks that id-based override records equivalent to the fixture
overrides give the legacy forecast totals in every forecast month.

## Legacy behaviour

- An "override" of a recurring item for one month is a separate one-time item named `"<name> (nadpisanie)"` with a
  `targetMonth` (`handleSaveOverride` in the month page).
- Overrides are matched **by name** (`name.includes("(nadpisanie)")` + `replace`): renaming an item breaks the
  override, two items with the same name are both affected, and the Polish suffix leaks into user data.
- The matching logic is duplicated for expenses and incomes in `use-forecast.ts` and `dashboard-content.tsx`;
  monthly totals (`calculateMonthly*`) count both the item and its override.
- "From this month on" changes the item amount globally, including history.
- Payment status (`payment_status`) is stored per item and month.
