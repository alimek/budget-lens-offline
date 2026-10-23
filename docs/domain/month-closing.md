# Month closing

Status: **implemented** in `packages/core/src/month-closing.ts` (#84). Persistence and its atomic transaction
belong to #85; payment-status storage is `packages/db/src/occurrences-repository.ts` (#83), which refuses a status
change of a closed month with `month-closed`.

## Model and transitions

`BudgetMonth` is an `ActiveMonth` or `ClosedMonth`. Both carry `month: YearMonth`, `openingBalance`,
`closingBalance`, `totalIncome`, `totalExpenses` and `netChange` in integer `MinorUnits` of the budget's
`Settings.baseCurrency`. Closed months also carry `baseCurrency` and `closedOccurrences`.

- `createInitialMonth(month, openingBalance)` requires an explicit calendar month and starting balance. Opening
  and closing balances start equal, totals and net change at zero. Negative balances are valid. Core reads no
  clock and creates no timestamps; the app chooses its calendar month and persistence supplies timestamps.
  Onboarding ([#111](https://github.com/alimek/budget-lens-offline/issues/111)) calls it with `openingBalance = 0`
  ([owner decision, 2026-10-23 16:15](../decisions.md)): the balance is 0 until the user adds at least one private
  account with its current amount ([#66](https://github.com/alimek/budget-lens-offline/issues/66)), and from then on it is calculated from the sum of the account
  amounts. How this maps onto this model (an `openingBalance` that stays unchanged once the month exists, immutable
  closed months, the next month opening at the previous closing balance) is an implementation detail to settle in
  the #66 work.
- `updateBalance(month, balance)` returns a new frozen active month with the actual closing balance and
  `netChange = closingBalance - openingBalance`. Opening balance and planned totals stay unchanged.
- `closeMonth(months, input)` takes the **complete** month collection and an input containing
  `{ currentMonth, closingBalance, items, overrides, paymentStatuses, baseCurrency, rates }`. It validates exactly
  one active month, strictly after every closed month; duplicate or earlier active months return
  `month-sequence-conflict`. Null/non-object month entries return `invalid-month`.
  `currentMonth` is the caller's calendar month; closing a future month is rejected. Older active months can close
  one by one to fill a gap, without skipping months.
- All transitions return `{ ok: true, value }` or `{ ok: false, error }`. Closing returns
  `{ closed, next, unpaid, unreceived }` in `value`. Inputs are never mutated.

Closing resolves occurrences with `resolveOccurrences` (#5): amount overrides replace the original amounts,
skips remove occurrences, and schedules exclude inactive items. Totals are base-currency minor units, including
unsettled ones: **every** effective occurrence is first converted per row with `convertMinor` from **its own**
item currency to `baseCurrency`, and only the converted `baseAmount`s are then summed with `sumMinorUnits`
(#138, `month-closing.test.ts`: "freezes original currency, applied rate and converted totals"). Amounts of two
item currencies are never added together, so no mixed-scale total can appear. These are planned totals, not
inferred bank transactions. `netChange` keeps the legacy
balance-update meaning: actual closing minus opening, which can differ from `totalIncome - totalExpenses`.
The caller's actual closing balance wins; core does not infer it from the planned totals.

The next month is the immediate calendar successor (December → January), with opening and closing balances equal
to the closed month's closing balance. Its income, expense and net-change totals start at zero.
Persistence (#85) must preserve this continuity: an existing active month's opening balance equals the previous
closed month's closing balance. Core guarantees it when creating the next month; it does not revalidate loaded
opening balances against history.

## Item currencies and closing rates

[Owner decision, 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126):
per-item currency is in MVP. Base currency is selected during onboarding and locked once onboarding is confirmed;
changing it later is not supported. Onboarding/persistence enforce that lifecycle rule, not the pure closing function.

Closing takes `ClosingItem`, which since #138 **is** `ScheduledItem`: `{ id, itemType, currency, amount, schedule }`
with the required `currency: CurrencyCode`. Its amount and occurrence overrides are minor units of that item's
currency, and each resolved occurrence exposes it. `baseCurrency` comes from the locked `Settings.baseCurrency`.
`rates` maps each used foreign currency to a finite **positive** number: base-currency major units per one
source-currency major unit, selected by the caller for the month being closed. Rates have the same decimal-number
representation as `multiplyByRate`; arithmetic uses their decimal form with BigInt, not floating-point products.
For a non-PLN base, closing (#84) still takes a caller-chosen numeric cross-rate. That is a known gap against the
cross-rate rule of [settings.md](settings.md) (via PLN, decimal strings, one rounding, no pre-computed cross-rate),
which the forecast already follows. Core never fetches NBP data, selects a cached or manual quote, or reads the clock.

The numeric `rate` is provisional until [#141](https://github.com/alimek/budget-lens-offline/issues/141), which moves
closing onto `convertViaPln` with decimal-string `mid` rates and adds their effective date and source (`nbp` or
`manual`) to the snapshot. #141 remains open; #85 must coordinate its persisted rate shape with that contract.

Each frozen occurrence stores `{ itemType, itemId, month, amount, currency, rate, baseAmount, settled }`:
`amount` is the effective original-currency amount after overrides; `baseAmount` is its converted integer amount
in the closed month's `baseCurrency`. For the base currency, rate is exactly 1 and amount is unchanged; no rate
input is needed. Only own properties of `rates` are accepted; inherited quotes count as missing. Unused rates are
ignored. Every effective foreign occurrence, even a zero-amount one, requires a rate; skipped and inactive occurrences do not. Missing rates return `missing-exchange-rate` without throwing.

`convertMinor(amount, rate, source, target)` shares the exact decimal arithmetic of `multiplyByRate`, accounts for
both currency exponents, and rounds **once**, half away from zero, to target minor units. For example,
10000 JPY minor units at 0.024574 PLN/JPY become 24574 PLN minor units. Converting between different exponents
must not round at the source scale first. Individual converted amounts are rounded before summing monthly totals.
Conversion overflow returns `amount-overflow`; invalid rates return `invalid-exchange-rate`.

Frozen original amounts, currencies, rates and converted amounts do not change when later rates or item rules
change. #85 persists those facts in `closed_occurrences`; history never converts them again at current rates.
The table exists in `packages/db` schema v1 (#74). It stores the rate as a `mid` decimal string (PLN per
unit) with source and effective date, matching #141 rather than today's provisional numeric `rate`.

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

Snapshots are now required by the owner decision linked above. Their shape and the immutable-history policy
remain isolated while the remaining [#40 discussion](https://github.com/alimek/budget-lens-offline/issues/40) is pending:

1. **Snapshot closed occurrences.** `buildClosedOccurrences(resolvedOccurrences, paymentStatuses, { baseCurrency, rates })` is
   the single pure snapshot builder. It copies the original and converted monetary facts and settlement status into frozen
   rows and a frozen array: no live item, schedule, name or override references. The closed month itself is frozen
   too. History reads
   these facts rather than re-running recurrence after future edits or engine changes. #85 must write these rows
   to `closed_occurrences` in the same transaction as closing and creating the next month. Item names remain
   item-level metadata, as proposed in #40.
2. **Closed months are immutable.** `validateMonthEditable(month)` is the one policy guard and returns
   `month-closed`; `updateBalance` uses it and closing uses `updateBalance`. Rule and override edits go through
   `planRuleEdit` ([rule versions](rule-versions.md), #80), which rejects any edit that changes a closed month;
   payment write paths must apply this guard or the equivalent closed-history validation before persisting. Reopening or
   correcting closed history is outside MVP. Database writes still need transactional enforcement (#83/#85).

## Errors

Codes only, never UI messages:

| Code | Meaning |
| --- | --- |
| `month-closed` | A balance write targets a closed month. |
| `no-active-month` | There is no active month to close (including a repeated close). |
| `multiple-active-months` | More than one active month exists. |
| `invalid-month` | The supplied month is not `YYYY-MM`, or the collection contains a null/non-object entry. |
| `future-month` | The active month is after the supplied current calendar month. |
| `month-sequence-conflict` | The active month is already closed, or is not later than every closed month. |
| `month-out-of-range` | `9999-12` has no successor in the supported `YearMonth` range. |
| `invalid-currency` | The supplied `baseCurrency` is not a supported code, or a row handed to `buildClosedOccurrences` directly has one. Inside `closeMonth` an item with an unsupported currency never gets here: the resolver reports it as an invalid item and closing fails with `invalid-occurrences`. |
| `missing-exchange-rate` | An effective foreign-currency occurrence has no supplied rate. |
| `invalid-exchange-rate` | A used foreign rate is not a finite positive number. |
| `invalid-amount` | A supplied balance or resolved amount is not a safe integer; occurrence amounts must be nonnegative. |
| `amount-overflow` | Conversion, balance subtraction or summing totals exceeds the safe integer range. |
| `invalid-occurrences` | Resolution reports invalid schedules or rejected overrides, or snapshot occurrences have duplicate keys. |
| `invalid-payment-status` | A payment row has an invalid type, id, month or settled flag. |
| `duplicate-payment-status` | Payment rows share a type, item id and month. |

Item identity and original amounts are validated when loaded by the items repository, as for `resolveOccurrences`.
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
payment matching, unpaid/unreceived lists, foreign-currency conversion, exponent scaling, single-rounding rules,
missing/invalid rates, frozen snapshots and closed-history protection.
Legacy mapping exists only in characterization test helpers; no legacy import API exists in `src`.
