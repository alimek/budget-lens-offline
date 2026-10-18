# Recurrence

Status: **implemented** in `packages/core` (#4): `src/year-month.ts` and `src/recurrence.ts`.

## Months (`YearMonth`)

- Months are `YYYY-MM` strings everywhere (months 01–12), branded as `YearMonth`. Create values with
  `toYearMonth` (throws `RangeError` for anything else) or narrow them with `isYearMonth`.
- `addMonths(month, count)`, `monthsBetween(from, to)` (positive when `to` is later) and `daysInMonth(month)`
  (Gregorian leap years). No `Date` objects and no system clock.

## Schedules

A `Schedule` decides in which months an item (expense **or** income – both use the same rule) has an occurrence:

- **One-time:** `{ kind: "one-time", month, dayOfMonth? }` – one occurrence in `month`.
- **Recurring:** `{ kind: "recurring", intervalMonths, anchor, dayOfMonth?, endMonth? }` – every `intervalMonths`
  months starting in `anchor` (the first occurrence), up to and including `endMonth` when set. Nothing happens
  before the anchor. Any anchor month works, e.g. quarterly from February is February/May/August/November.
- `dayOfMonth` (1–31) is clamped to the last day of each month: 31 → 30 in April, 29/30/31 → 28 in February
  (29 in leap years). An `Occurrence` is `{ month, day? }`; `day` is present only when the schedule has a
  `dayOfMonth`.

Functions (pure, the month range is always passed in):

- `occurrencesInRange(schedule, from, to)` – occurrences in month order, `from` and `to` inclusive.
- `isActiveInMonth(schedule, month)`.
- `validateSchedule(schedule)` – error codes for the UI: `invalid-interval` (not an integer ≥ 1),
  `invalid-day-of-month` (not an integer 1–31), `end-before-anchor`. The two functions above throw a `RangeError`
  for an invalid schedule.

## Mapping legacy items (`scheduleFromLegacy(item, startMonth)`)

Legacy recurring items have no start date, so the caller passes a `startMonth` (for example the month the item was
created). The anchor is the first month at or after it that keeps the legacy calendar:

| Legacy | Schedule |
| --- | --- |
| `monthly` or recurring without `frequency` | every 1 month, anchor = `startMonth` |
| `quarterly` | every 3 months, anchor = first January/April/July/October ≥ `startMonth` |
| `yearly` | every 12 months, anchor = first `startMonth` field month (or January) ≥ `startMonth` |
| one-time with `targetMonth` | one-time in `targetMonth` |
| one-time without `targetMonth` | `null` (legacy never shows it) |

`day_of_month` maps to `dayOfMonth`. From `startMonth` on, the mapped schedules give the same months as legacy
(characterization tests in `packages/core/test/recurrence.characterization.test.ts`); before it they are inactive.

## Legacy behaviour (`lib/utils/expense-filter.ts`)

- Expenses have `frequency` `monthly | quarterly | yearly`, or are one-time with a `targetMonth`.
- Quarterly is always January/April/July/October (`QUARTERLY_MONTHS = [0, 3, 6, 9]`), regardless of the start.
- Yearly uses `startMonth`; without it the item falls in January.
- No start or end date: a recurring item is active in every month, including months before it was created.
- `day_of_month` is stored but not used in calculations.
- Month indexes are mixed: `month` is 0–11, `startMonth` / `targetMonth` are 1–12.
- Incomes can only be monthly (SQL `CHECK`).
