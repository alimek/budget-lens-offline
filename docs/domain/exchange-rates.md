# Exchange rates (NBP)

Status: fetching and cache **not implemented yet** (#8). Pure conversion is implemented in
`packages/core/src/convert-minor.ts` (#6).

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
- Convert with the implemented `convertMinor(amount, from, to, rateLookup)` (#6), described below.
- Currencies come from `Settings.trackedCurrencies` ([settings.md](settings.md)).

## Exact conversion and forecast (#6)

`convertMinor` receives a lookup of positive decimal strings in PLN per major unit (up to 12 decimal places).
It computes `amountMinor × midFrom × 10^toExponent / (midTo × 10^fromExponent)` as one BigInt fraction and rounds
once, half away from zero, checking the safe-integer range. It never rounds an intermediate PLN amount.
PLN has implicit rate 1; identity needs no lookup. Missing/invalid rates and overflow throw `RangeError`;
the forecast reports typed error codes instead. `multiplyByRate` alone does not account for currency exponents.

The final [#124 owner decisions](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263755326)
supersede the early research: table A only, current rates only, fetch once a day on app open, freshness based on
24 hours since the last successful fetch. Manual rates are PLN-quoted and win when newer; the forecast uses the
newer effective date and prefers manual on a tie. Cache inputs must validate date/source metadata. Both conversion
legs may have different dates; the forecast reports the actual legs with their supplied stale flags. The UI can
show the older effective date and flag either stale leg.

Forecast consumes current candidates as inputs; it does not fetch NBP or implement `RateStore`. Refresh must include
base currency, item currencies and savings currencies. Open/future months use the same current selection; closed
months must use #141 snapshots. See [forecast.md](forecast.md) for the contract and integration boundaries.
