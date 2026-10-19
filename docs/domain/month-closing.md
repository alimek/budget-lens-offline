# Month closing

Status: **implemented** in `packages/core/src/month-closing.ts` (#84). Persistence and its atomic transaction
belong to #85; payment-status storage belongs to #83.

## Model and transitions

`BudgetMonth` is an `ActiveMonth` or `ClosedMonth`. Both carry `month: YearMonth`, `openingBalance`,
`closingBalance`, `totalIncome`, `totalExpenses` and `netChange` in integer `MinorUnits` of the budget's
`Settings.baseCurrency`. Closed months also carry `closedOccurrences`.

- `createInitialMonth(month, openingBalance)` requires an explicit calendar month and starting balance. Opening
  and closing balances start equal, totals and net change at zero. Negative balances are valid. Core reads no
  clock and creates no timestamps; the app chooses its calendar month and persistence supplies timestamps.
- `updateBalance(month, balance)` returns a new frozen active month with the actual closing balance and
  `netChange = closingBalance - openingBalance`. Opening balance and planned totals stay unchanged.
- `closeMonth(months, { currentMonth, closingBalance, items, overrides, paymentStatuses })` takes the **complete**
  month collection, so it can validate exactly one active month and avoid overwriting an existing next month.
  `currentMonth` is the caller's calendar month; closing a future month is rejected. Older active months can close
  one by one to fill a gap, without skipping months.
- All transitions return `{ ok: true, value }` or `{ ok: false, error }`. Closing returns
  `{ closed, next, unpaid, unreceived }` in `value`. Inputs are never mutated.

Closing resolves occurrences with `resolveOccurrences` (#5): amount overrides replace the original amounts,
skips remove occurrences, and schedules exclude inactive items. It sums **all** effective incomes and expenses,
including unsettled ones. These are planned totals, not inferred bank transactions. `netChange` keeps the legacy
balance-update meaning: actual closing minus opening, which can differ from `totalIncome - totalExpenses`.
The caller's actual closing balance wins; core does not infer it from the planned totals.

The next month is the immediate calendar successor (December → January), with opening and closing balances equal
to the closed month's closing balance. Its income, expense and net-change totals start at zero.

## Payment status and confirmation

The minimal `PaymentStatus` is `{ itemType, itemId, month, settled }`, unique per
`(itemType, itemId, month)`. `settled: true` means paid for expenses and received for incomes. A missing row or
`settled: false` means unpaid/unreceived. Payment statuses do not change amounts or totals.

The close result lists `unpaid` expenses and `unreceived` incomes as snapshot rows, in item order, with effective
amounts. Zero-amount occurrences still need settlement; skipped or inactive occurrences do not appear. Statuses
for other months or absent occurrences do not settle anything in this month. Duplicate status keys are rejected,
even if their flags agree; malformed rows return `invalid-payment-status`.

The caller can calculate this pure plan to show a confirmation, then persist the accepted result. Unsettled items
do not block closing and are not automatically marked settled or carried into the next month. There is no UI,
confirmation side effect, table or repository in core. #83 stores statuses and enforces their unique key.

## Defaults pending #40

These are defaults while the owner answers the [#40 discussion](https://github.com/alimek/budget-lens-offline/issues/40).
They are deliberately isolated:

1. **Snapshot closed occurrences.** `buildClosedOccurrences(resolvedOccurrences, paymentStatuses)` is the single
   pure snapshot builder. It copies only `{ itemType, itemId, month, amount, settled }` into frozen rows and a frozen
   array: no live item, schedule, name or override references. The closed month itself is frozen too. History reads
   these facts rather than re-running recurrence after future edits or engine changes. #85 must write these rows
   to `closed_occurrences` in the same transaction as closing and creating the next month. Item names remain
   item-level metadata, as proposed in #40.
2. **Closed months are immutable.** `validateMonthEditable(month)` is the one policy guard and returns
   `month-closed`; `updateBalance` uses it and closing uses `updateBalance`. Future override/payment/rule write
   paths must apply this guard or the equivalent closed-history validation before persisting. Reopening or
   correcting closed history is outside MVP. Database writes still need transactional enforcement (#83/#85).

## Errors

Codes only, never UI messages:

| Code | Meaning |
| --- | --- |
| `month-closed` | A balance write targets a closed month. |
| `no-active-month` | There is no active month to close (including a repeated close). |
| `multiple-active-months` | More than one active month exists. |
| `invalid-month` | The supplied month is not `YYYY-MM`. |
| `future-month` | The active month is after the supplied current calendar month. |
| `next-month-exists` | Creating the successor would overwrite an existing month. |
| `month-out-of-range` | `9999-12` has no successor in the supported `YearMonth` range. |
| `invalid-amount` | A supplied balance or resolved amount is not a safe integer; occurrence amounts must be nonnegative. |
| `amount-overflow` | Balance subtraction or summing totals exceeds the safe integer range. |
| `invalid-occurrences` | Resolution reports invalid schedules or rejected overrides, or snapshot occurrences have duplicate keys. |
| `invalid-payment-status` | A payment row has an invalid type, id, month or settled flag. |
| `duplicate-payment-status` | Payment rows share a type, item id and month. |

Item identity and base amounts are validated when loaded by the items repository, as for `resolveOccurrences`.
Closing refuses any invalid schedule or rejected override in the supplied collection rather than freezing partial
or fallback totals. Orphaned valid overrides remain ignored according to #5. Warning thresholds belong to
`Settings` and forecast (#6); closing introduces no thresholds or currency constants.

## Legacy behaviour and verification

The test-only reference (`test/legacy/month-closing.ts`) remains unchanged:

- Closing carried the actual closing balance into the next month's opening and closing balances, including year
  rollover. Ported transitions are compared with these results in `test/month-closing.characterization.test.ts`.
- Closing did not save income, expense or net-change totals; the dialog summed floats and ignored overrides.
- Closing and opening were separate writes without a transaction; #85 will apply the pure result atomically.
- The first month was automatically created at zero, mixing local calendar time and UTC timestamps.

`src/month-closing.test.ts` protects override-aware totals, actual balance changes, balance carry-forward,
payment matching, unpaid/unreceived lists, validation failures, frozen snapshots and closed-history protection.
Legacy mapping exists only in characterization test helpers; no legacy import API exists in `src`.
