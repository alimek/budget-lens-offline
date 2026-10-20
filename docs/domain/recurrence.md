# Recurrence

Status: **implemented** in `packages/core` (#4): `src/year-month.ts` and `src/recurrence.ts`.

## Months (`YearMonth`)

- Months are `YYYY-MM` strings everywhere (months 01–12), branded as `YearMonth`. Create values with
  `toYearMonth` (throws `RangeError` for anything else) or narrow them with `isYearMonth`.
- `addMonths(month, count)`, `monthsBetween(from, to)` (positive when `to` is later) and `daysInMonth(month)`
  (Gregorian leap years). No `Date` objects and no system clock.
- Supported months are `0000-01` to `9999-12`. `addMonths` throws a `RangeError` for a `count` that is not a safe
  integer or a result outside that range.

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

- `occurrencesInRange(schedule, from, to)` – occurrences in month order, `from` and `to` inclusive. The first and
  last occurrence in the range are computed arithmetically, so only the returned months are built, also for a range
  that ends at `9999-12`.
- `isActiveInMonth(schedule, month)`.
- `validateSchedule(schedule)` – error codes for the UI. It also checks schedules loaded from storage at runtime: a
  value of the wrong type is a code, never a thrown `TypeError`, and nothing invalid is silently ignored. `null`
  optional fields (`dayOfMonth`, `endMonth`, as a nullable SQLite column returns them) count as absent.

| Code | When |
| --- | --- |
| `invalid-kind` | the schedule is not an object (for example `null`), or `kind` is not `"one-time"` or `"recurring"` |
| `invalid-month` | a one-time `month` is not a `YYYY-MM` string |
| `invalid-anchor` | `anchor` is not a `YYYY-MM` string |
| `invalid-end-month` | `endMonth` is set but is not a `YYYY-MM` string |
| `invalid-interval` | `intervalMonths` is not an integer from 1 to `MAX_INTERVAL_MONTHS` (120, 10 years) |
| `invalid-day-of-month` | `dayOfMonth` is set but is not an integer 1–31 |
| `end-before-anchor` | `endMonth` is before `anchor` |

`occurrencesInRange` and `isActiveInMonth` throw a `RangeError` for an invalid schedule.

An item's schedule can change over time: each [rule version](rule-versions.md) (#80) holds an amount and a schedule
from an `effectiveFrom` month, and the schedule decides the occurrence months inside that version's window.

## Legacy data

Legacy data is **not imported** and the legacy migrations are not ported (owner decision). The legacy rules are
only compared with the ported ones in the characterization tests
(`packages/core/test/recurrence.characterization.test.ts`): a test-only helper (`test/legacy-schedule.ts`) maps each
legacy fixture to a schedule anchored at the first month on or after a start month that keeps the legacy calendar
(quarterly January/April/July/October, yearly the item's `startMonth` or January). From that month on the ported
schedules give the same months as legacy; before it they are inactive.

## Legacy behaviour (`lib/utils/expense-filter.ts`)

- Expenses have `frequency` `monthly | quarterly | yearly`, or are one-time with a `targetMonth`.
- Quarterly is always January/April/July/October (`QUARTERLY_MONTHS = [0, 3, 6, 9]`), regardless of the start.
- Yearly uses `startMonth`; without it the item falls in January.
- No start or end date: a recurring item is active in every month, including months before it was created.
- `day_of_month` is stored but not used in calculations.
- Month indexes are mixed: `month` is 0–11, `startMonth` / `targetMonth` are 1–12.
- Incomes can only be monthly (SQL `CHECK`).
