# Recurrence

Status: **not implemented yet** in `packages/core` – tracked in #4.

## Legacy behaviour (`lib/utils/expense-filter.ts`)

- Expenses have `frequency` `monthly | quarterly | yearly`, or are one-time with a `targetMonth`.
- Quarterly is always January/April/July/October (`QUARTERLY_MONTHS = [0, 3, 6, 9]`), regardless of the start.
- Yearly uses `startMonth`; without it the item falls in January.
- No start or end date: a recurring item is active in every month, including months before it was created.
- `day_of_month` is stored but not used in calculations.
- Month indexes are mixed: `month` is 0–11, `startMonth` / `targetMonth` are 1–12.
- Incomes can only be monthly (SQL `CHECK`).

## Target model (#4)

- A rule "every N months from an anchor month", e.g. `{ intervalMonths, anchor: YYYY-MM, dayOfMonth?, endMonth? }`,
  plus one-time items with `targetMonth`. The same rule for expenses and incomes.
- Pure functions such as `isActiveInMonth(rule, month)` / `occurrencesInRange(rule, from, to)`; no system clock.
- `dayOfMonth` is clamped to the last day of the month (31 → 28/29 in February).
- Months are `YYYY-MM` strings everywhere.
- Legacy mapping: `monthly` → every 1 month; `quarterly` → every 3 months anchored in January (legacy behaviour);
  `yearly` → every 12 months anchored at `startMonth` (or January).
