# Occurrence overrides

Status: **not implemented yet** in `packages/core` – tracked in #5.

## Legacy behaviour

- An "override" of a recurring item for one month is a separate one-time item named `"<name> (nadpisanie)"` with a
  `targetMonth` (`handleSaveOverride` in the month page).
- Overrides are matched **by name** (`name.includes("(nadpisanie)")` + `replace`): renaming an item breaks the
  override, two items with the same name are both affected, and the Polish suffix leaks into user data.
- The matching logic is duplicated for expenses and incomes in `use-forecast.ts` and `dashboard-content.tsx`.
- "From this month on" changes the item amount globally, including history.
- Payment status (`payment_status`) is stored per item and month.

## Target model (#5)

- `occurrence_overrides` records: `{ id, itemType: "expense" | "income", itemId, month: YYYY-MM, amount?, skipped?, note? }`
  with `amount` in `MinorUnits`; unique per `(itemType, itemId, month)`.
- `resolveOccurrences(items, overrides, month)` returns the effective occurrences (overridden amounts, skipped
  ones removed). **No matching by name.**
- "From this month on" is a change of the item's rule/version, not an override.
- A legacy import function converts `"X"` + `"X (nadpisanie)"` pairs into override records.
