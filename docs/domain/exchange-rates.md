# Exchange rates (NBP)

Status: **not implemented yet** in `packages/core` – tracked in #8.

## Legacy behaviour (`lib/exchange-rates/refresh.ts`)

- Fetches table A average rates (`mid`) from the NBP API on a server cron (Vercel, 15:00 UTC) and stores them in
  Supabase.
- Currencies are hardcoded (`SUPPORTED_CURRENCIES`: USD, EUR, GBP, CHF, JPY); `user_settings.tracked_currencies`
  is unused.
- `refreshAllExchangeRates` uses `Promise.all`, so one failing currency aborts the whole refresh.
- `shouldRefreshRates` checks `updated_at` of a single arbitrary row.
- Savings are valued with `parseFloat(amount) * rate` and `toFixed(2)` (floats).

### JPY per-100-units quirk

NBP quotes some currencies (e.g. **JPY**, HUF) **per 100 units**, but legacy stores the returned `mid` as a per-unit
rate. The seed in `002_create_exchange_rates.sql` is `0.027` per 1 JPY, while NBP returns ~2.6 per 100 JPY, so after a
refresh JPY savings are overvalued about **100×** (reported in #8; the characterization tests in #19 assert it).

## Target (#8)

- `fetchNbpRate(currency, fetchFn)` – table A, response validation, network and 404 errors; `fetch` is injected.
- An injected `RateStore` cache (`get`, `set`, `getAll`); in-memory implementation in core for tests, SQLite in the app.
- `getRate(currency, { now, maxAgeHours })` – fresh cached rate, otherwise try to refresh; without network return the
  last rate with `stale: true` and its `effectiveDate` (weekends/holidays have no new table).
- Apply the NBP multiplier (per 100 units) and convert to PLN `MinorUnits` with explicit rounding (#2).
- Currencies come from `Settings.trackedCurrencies` (#7).
