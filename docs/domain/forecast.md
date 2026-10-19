# Forecast

Status: **implemented** in `packages/core/src/forecast.ts` (#6), with exact currency conversion shared in
`src/money.ts` via `src/convert-via-pln.ts`. No clock, I/O or storage.

## Input and output

`forecast({ items, overrides, paymentStatuses, currentBalance, totalSavings, fromMonth, months?, settings, rates })`
returns `{ ok: true, currency, forecast, warnings, ratesUsed, rejectedOverrides }`, or
`{ ok: false, error }`. A failure returns no partial totals.

- `fromMonth` is the **active** month, passed explicitly. This API projects open and future months; it does not read
  or recalculate closed history. `months` includes the active month, defaults to `Settings.forecastHorizonMonths`
  and must be an integer from 1 to `MAX_FORECAST_HORIZON_MONTHS`, within the supported calendar range.
- Each `ForecastItem` is an alias of `ClosingItem`, including required `currency: CurrencyCode`, until #138
  moves currency onto the shared item model. A resolved occurrence retains its currency through `occurrence.item`;
  its override amount is in that same currency. Items must have valid identifiers and unique `(itemType, id)` keys
  on load; payment statuses must be unique per `(itemType, itemId, month)`.
- Each month uses `resolveOccurrences`, which enumerates schedules through `occurrencesInRange`, replaces overridden
  amounts and removes skipped occurrences. Rejected overrides are returned once, as in the resolver; ignored orphaned overrides can be found with `findOrphanedOverrides`.
- Payment statuses are `{ itemType, itemId, month, settled }`; `settled: true` means paid expense or received income.
  Only active-month completed occurrences are excluded. Future-month statuses are ignored. `currentBalance` already
  includes completed payments, so they must not be applied again. An override keeps its original item's payment key.
- `currentBalance`, `totalSavings`, thresholds, all output rows and warning amounts are **base-currency MinorUnits**.
  Savings are today's sum of individually converted and rounded savings rows, supplied by the caller and held
  constant across the horizon. The forecast does not add savings to the rolling balance.
- Each row is `{ month, income, expenses, netChange, balance, totalFunds }`: `netChange = income - expenses`,
  `balance = previous balance + netChange` (starting at `currentBalance`), `totalFunds = balance + totalSavings`.
  All arithmetic checks the safe-integer range, including intermediate sums.

## Currency conversion

The [owner decisions in #39](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126)
put per-item currency in MVP and lock the base currency after onboarding. Supported currencies are PLN + table A
except XDR. The [#124 resolution](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263755326)
requires one rounding through PLN and current rates only.

`rates` contains current cached candidates, at most one per currency and source (`nbp` or `manual`), with
`{ currency, mid, effectiveDate, source, stale }`. `mid` is a positive decimal string, PLN per **one major unit**.
The forecast validates every candidate date as a real `YYYY-MM-DD` calendar date, including leap years, before
selecting any rates. A malformed date fails with `invalid-rate`, even on an unused candidate. The cache validates
source/freshness metadata before calling core. The forecast selects the newer
`effectiveDate` for each currency; on a tie it prefers manual, following #39's default. No rate history lookup.

Each needed foreign occurrence is converted **after overrides and payment filtering**, with `convertViaPln`
delegating to `money.ts`, then rounded before summing. PLN is implicit rate 1; base-currency items need no rate. Zero-valued foreign occurrences
still require rates. Unused currencies, skipped items and completed active-month payments need none. Every month
uses the same selected rates; no FX projection. Cross-currency conversion uses both legs without requiring equal
effective dates; mixed-date and stale legs remain visible in `ratesUsed`.

`ratesUsed` contains the selected non-PLN legs actually used, including the base leg when needed. It preserves
`mid`, `effectiveDate`, `source` and `stale` so the UI can show rate evidence. Freshness is supplied by the cache:
stale means at least 24 hours since the last successful fetch (#8/#93); core never reads time. Missing or invalid
needed rates fail the forecast rather than silently substituting zero.

## Warnings and errors

Warnings carry `{ code, type, month, params: { amount, threshold, currency, monthsAhead } }`; the UI translates and
formats them. `monthsAhead` starts at 1 for the active month, matching legacy wording. Warning order is month order,
with balance warning before outflow warning.

| Code | Severity | Condition |
| --- | --- | --- |
| `negative-balance` | `critical` | Balance < 0; amount is signed balance, threshold is 0 |
| `low-balance` | `caution` | 0 ≤ balance < `Settings.lowBalanceThreshold` |
| `large-outflow` | `info` | Net change < −`Settings.largeExpenseThreshold`; amount is the positive outflow |

Exact threshold equality produces no warning. Zero balance warns when the low-balance threshold is positive.
Zero thresholds do not disable warnings: negative balances still produce critical warnings, and any negative net
change produces an outflow warning. Critical and outflow warnings can coexist.

Errors are codes, never UI strings: `invalid-settings`, `invalid-month`, `invalid-horizon`, `invalid-amount`,
`invalid-item` (with `itemId`), `missing-rate` / `invalid-rate` (with `currency`), and `amount-overflow`.
Invalid item amounts, currencies, types and schedules all fail with `invalid-item`, without partial totals.
Rejected stored overrides retain the resolver's nonfatal diagnostics. Only `MoneyOverflowError` from the shared
money arithmetic maps to `amount-overflow`; other unexpected errors propagate.

## Month closing and later integration

This implementation shares money arithmetic, `ClosingItem` and the `PaymentStatus` type with merged #84 / PR #137.
Forecast does not call month closing; both use `settled` for paid expenses and received incomes.
After closing, the caller can start the next forecast with the new active month and its current balance.
Closed-month charts must read stored totals and per-occurrence FX snapshots from #84, never this live-rate forecast.
#141 can extend rate metadata and use decimal-string conversion without changing the rounding policy.
#138 can later move currency onto the shared item/occurrence model. #140 can reuse the conversion and rate evidence
here when integrating the rates cache and forecast hook (#88); #8/#92/#93 own fetching, storage and freshness.

## Legacy behaviour and evidence

Legacy `useForecast` projects the local current month plus twelve months, reads the system clock and uses Polish
month names/messages. It hardcodes low-balance and outflow thresholds (5000 / 10000 PLN), ignores zero balance,
and applies name-based overrides. The port uses explicit months, Settings, warning codes and id-based overrides.

`src/forecast.test.ts` covers rolling balances, payment keys, overrides/skips, warning boundaries, FX and failures.
`src/convert-via-pln.test.ts` checks pair directions, ISO exponents and exact rounding. The forecast characterization
compares the fixture budget's rolling totals and warning severities at legacy thresholds; the old golden master
remains unchanged. Deliberate differences are recorded in `test/LEGACY.md`.
