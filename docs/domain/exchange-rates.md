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
- Convert an amount in a currency to PLN `MinorUnits` using the rate as returned (per 1 unit) with `convertMinor`
  (#39, #8/#92). It multiplies by the rate with `multiplyByRate` (#2, rounds half away from zero) **and** scales by
  `10^(targetExponent − sourceExponent)`: `multiplyByRate` keeps the scale of the source amount, so on its own it is
  only correct when both currencies have the same exponent. Example: ¥10 000 (`10000` JPY minor units, exponent 0)
  × 0.024574 is 245,74 zł = `24574` groszy (exponent 2); `multiplyByRate` alone gives `246` (2,46 zł, 100× too
  small). See [money.md](money.md#type-and-operations-packagescoresrcmoneyts).
- Currencies come from `Settings.trackedCurrencies` ([settings.md](settings.md)).
