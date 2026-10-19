# Exchange rates (NBP)

Status: the NBP client/cache is **not implemented yet** (#8). Exact minor-unit conversion (`convertMinor`) and
caller-supplied rates in closing snapshots are implemented in #84. Forecast uses the shared conversion through
`convertViaPln` (#6); see [month-closing.md](month-closing.md).

## Legacy behaviour (`lib/exchange-rates/refresh.ts`)

- Fetches table A average rates (`mid`) from the NBP API on a server cron (Vercel, 15:00 UTC) and stores them in
  Supabase.
- Currencies are hardcoded (`SUPPORTED_CURRENCIES`: USD, EUR, GBP, CHF, JPY); `user_settings.tracked_currencies`
  is unused.
- `refreshAllExchangeRates` uses `Promise.all`, so one failing currency aborts the whole refresh.
- `shouldRefreshRates` checks `updated_at` of a single arbitrary row.
- Savings are valued with `parseFloat(amount) * rate` and `toFixed(2)` (floats).
- Stores `mid` as returned (per 1 unit), which is correct.

## Rate units

Rates are used exactly as the NBP API returns them: `mid` is the PLN value of **1 unit** of the currency (e.g. table
202/A/NBP/2026 of 2026-10-16: JPY `mid` = 0.024574). No multiplier is applied. This will be covered by a test against
a recorded NBP response fixture (planned with #8).

**Correction.** An earlier assumption that NBP quotes some currencies (e.g. JPY, HUF) in a different unit was wrong;
rates are per 1 unit ([#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427)). The characterization tests
(#3, merged in #19) use the per-unit rate
(JPY fixture `mid: 0.024574`).

## Target (#8)

- `fetchNbpRate(currency, fetchFn)` – table A, response validation, network and 404 errors; `fetch` is injected.
- An injected `RateStore` cache (`get`, `set`, `getAll`); in-memory implementation in core for tests, SQLite in the app.
- `getRate(currency, { now, maxAgeHours })` – fresh cached rate, otherwise try to refresh; without network return the
  last rate with `stale: true` and its `effectiveDate` (weekends/holidays have no new table).
- Convert with the implemented `convertViaPln(amount, from, to, rateLookup)` (#6), described below.
- Currencies come from `Settings.trackedCurrencies` ([settings.md](settings.md)).

## Exact conversion and forecast (#6)

`convertViaPln` receives a lookup of positive decimal strings in PLN per major unit (up to 12 decimal places).
It selects the legs and delegates to `convertMinorExact` in `money.ts`, the shared arithmetic used by
`convertMinor(amount, rate, source, target)` from #84. That implementation computes
`amountMinor × midFrom × 10^toExponent / (midTo × 10^fromExponent)` as one BigInt fraction and rounds once,
half away from zero, checking the safe-integer range. No intermediate PLN amount or numeric cross-rate is rounded.
PLN has implicit rate 1; identity needs no lookup. Missing/invalid rates and overflow throw `RangeError`;
the forecast reports typed error codes instead. `multiplyByRate` alone does not account for currency exponents.
Closing receives rates in target major units per source major unit; it does not assume a PLN quote is already
in base currency. See [money.md](money.md) for the shared conversion APIs.

The final [#124 owner decisions](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263755326)
supersede the early research: table A only, current rates only, fetch once a day on app open, freshness based on
24 hours since the last successful fetch. Manual rates are PLN-quoted and win when newer; the forecast uses the
newer effective date and prefers manual on a tie. Forecast validates candidate calendar dates before selection; the cache validates source metadata. Both conversion
legs may have different dates; the forecast reports the actual legs with their supplied stale flags. The UI can
show the older effective date and flag either stale leg.

Forecast consumes current candidates as inputs; it does not fetch NBP or implement `RateStore`. Refresh must include
base currency, item currencies and savings currencies. Open/future months use the same current selection; closed
months must use #84 snapshots (with rate metadata extended by #141). See [forecast.md](forecast.md) for the contract and integration boundaries.

## Owner decision: item currencies and frozen history

[2026-10-19 decision](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126):
items have their own currency in MVP; the base currency is locked after onboarding. Forecast uses the latest
cached NBP rate or a newer manual rate. At close, the caller supplies the selected foreign-to-base rates.
Closing snapshots retain each original amount/currency, applied rate and converted base amount, so later quotes
never rewrite history. Rate fetching, cache/manual precedence and onboarding enforcement remain outside #84.
