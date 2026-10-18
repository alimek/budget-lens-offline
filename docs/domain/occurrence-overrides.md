# Occurrence overrides

Status: **implemented** in `packages/core/src/occurrence-overrides.ts` (#5). The database table is a sketch for
Stage 1 (`packages/db` does not exist yet).

## Model

An `OccurrenceOverride` changes **one occurrence of one item in one month**:

```ts
{ id, itemType: "expense" | "income", itemId, month: YearMonth, amount?: MinorUnits, skipped?: boolean, note? }
```

- Either `amount` (the occurrence uses this amount instead of the item's) or `skipped: true` (the occurrence is left
  out). Unique per `(itemType, itemId, month)`.
- Items are matched by `(itemType, itemId)` only – **never by name**. Renaming an item or having two items with the
  same name does not affect overrides.
- "From this month on" is **not** an override: it is a change of the item's rule (rule versioning, #80), so past
  months keep their amounts. An override only ever changes its own month.
- Payment status stays per item and month (`payment_status`, legacy `004_create_payment_status.sql`): a resolved
  occurrence carries `item` and `month`, which is the key of its payment status. A skipped occurrence has nothing to
  pay.

## Functions

- `resolveOccurrences(items, overrides, month)` – the effective occurrences of `ScheduledItem`s
  (`{ id, itemType, amount, schedule }`) in `month`, in item order: `{ item, month, day?, amount, override? }`,
  overridden amounts applied, skipped occurrences removed.
  - **Decision (#5):** an override for a month in which the item has no occurrence, or for an unknown item, is
    **ignored** – it can be left over after a schedule change (e.g. a new end month). The UI prevents creating one with
    `validateOverride`.
  - Two overrides with the same `(itemType, itemId, month)` throw a `RangeError` (the unique key is broken).
- `validateOverride(override, item)` – error codes for the UI: `empty-override` (no amount and not skipped),
  `skipped-with-amount`, `inactive-month` (the item has no occurrence in that month).

## Legacy import (`overridesFromLegacy(items, itemType, createId)`)

Converts legacy name-based overrides – one-time items named `"<name> (nadpisanie)"` with a `targetMonth` – into
override records; amounts must already be `MinorUnits`. It keeps the legacy month totals
(`test/occurrence-overrides.characterization.test.ts` compares them with the legacy forecast):

- Every recurring item named `<name>` that legacy shows in that month is a target. The first target (input order)
  gets an override with the sum of the override items' amounts; any other same-name target is `skipped` (legacy hid
  all of them).
- An override item with no target (e.g. the recurring item was renamed) stays a regular one-time item, because legacy
  counts it like one.
- The returned `items` exclude the override items that became records; ids come from the injected `createId`.

This import is the only place that matches by name.

## Table sketch (Drizzle, `expo-sqlite`) – Stage 1

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
  ],
);
```

`itemId` points to an expense or an income depending on `itemType`, so there is no foreign key; deleting an item
deletes its overrides in the same transaction.

## Legacy behaviour

- An "override" of a recurring item for one month is a separate one-time item named `"<name> (nadpisanie)"` with a
  `targetMonth` (`handleSaveOverride` in the month page).
- Overrides are matched **by name** (`name.includes("(nadpisanie)")` + `replace`): renaming an item breaks the
  override, two items with the same name are both affected, and the Polish suffix leaks into user data.
- The matching logic is duplicated for expenses and incomes in `use-forecast.ts` and `dashboard-content.tsx`;
  monthly totals (`calculateMonthly*`) count both the item and its override.
- "From this month on" changes the item amount globally, including history.
- Payment status (`payment_status`) is stored per item and month.
