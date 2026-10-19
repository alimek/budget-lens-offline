# Exchange rates (NBP)

Status: the injected NBP client/cache is **implemented** (#8). Exact minor-unit conversion (`convertMinor`) and
caller-supplied rates in closing snapshots are implemented in #84; see [month-closing.md](month-closing.md).

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
202/A/NBP/2026 of 2026-10-16: JPY `mid` = 0.024574). No multiplier is applied. `src/exchange-rates.test.ts` checks
the recorded JPY response and converts 10,000 yen to 24,574 grosze with the existing `convertMinor`.

**Correction.** An earlier assumption that NBP quotes some currencies (e.g. JPY, HUF) in a different unit was wrong;
rates are per 1 unit ([#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427)). The characterization tests
(#3, merged in #19) use the per-unit rate
(JPY fixture `mid: 0.024574`).

## Client, current-rate store and lookup (#8)

- `fetchNbpRate(currency, fetchFn)` – table A, response validation, network and 404 errors; `fetch` is injected.
- An injected `RateStore` cache (`get`, `set`, `getAll`); in-memory implementation in core for tests, SQLite in the app.
- `getRate(currency, { store, now, maxAgeHours })` only reads storage. `now` is today's local `YYYY-MM-DD`, supplied
  by the app, and `maxAgeHours` comes from `Settings.rateMaxAgeHours` (default 24). It returns `mid`, `effectiveDate`,
  `source` and `stale`, or an error code such as `missing-rate`. It never fetches, including when offline/stale.
- `convertMinor(amount, rate, source, target)` is implemented in core money arithmetic (#84). Rates are target
  major units per source major unit, with exact decimal multiplication, exponent scaling and one final rounding.
  For a non-PLN base, the caller computes/selects the cross-rate; core closing does not assume NBP's PLN quote is
  already a base-currency rate.
- `requiredRateCurrencies(settings, itemCurrencies, savingsCurrencies)` deduplicates the non-PLN base, Settings
  tracked currencies, item currencies and savings currencies. PLN is implicit (`mid: "1"`, source `implicit`,
  never stale); it is not fetched or stored.

`RateStore.get(currency)` returns the current candidates for that currency; `set(rate)` replaces only the row
with the same `(currency, source)`; `getAll()` returns all current rows. Methods are asynchronous for the SQLite
adapter (#92). Each row contains `currency`, `mid` (positive decimal string, at most 12 fraction digits),
`effectiveDate` (`YYYY-MM-DD`), `source` (`nbp` or `manual`) and `fetchedAt` (injected epoch milliseconds; the entry
time for manual rows). There is no rate history. The in-memory store copies rows on read/write.

`selectCurrentRates` is the shared, generic selector for lookup and other consumers (including forecast #156):
the newer effective date wins; manual wins equal dates, independently of candidate order. It accepts already
validated candidates and preserves their metadata. This follows the
[orchestrator decision on #8](https://github.com/alimek/budget-lens-offline/issues/8#issuecomment-6276832887):
for NBP use the table date; for manual use the date entered by the user.

**Freshness follows that latest decision**, superseding the earlier successful-fetch-age rule: both NBP and manual
quotes are stale when `today - effectiveDate >= Settings.rateMaxAgeHours`. Calendar dates are compared at midnight
without reading the clock or depending on the host timezone. A Friday quote can therefore be stale on Sunday even
after a successful Sunday fetch. Manual rates are also `1 X = y PLN`; `fetchedAt` never decides precedence or staleness.

`refreshNbpRates(currencies, { store, fetchFn, now })` is an explicit app-open operation, separate from lookup.
Here `now` is injected epoch milliseconds. It skips each current NBP row fetched less than 24 hours ago and gets
the due currencies with one `fetchNbpRates` table-A request. `fetchNbpRate` remains available for a single latest
quote; neither function requests history or the `/today/` endpoint. They use HTTPS and validate the response per
the [NBP API contract](https://api.nbp.pl/en.html). Quotes keep decimal `mid` strings without per-100 scaling;
small exponent-form JSON numbers are expanded without rounding. Missing/malformed quotes and failed writes are
reported per currency, preserving other successes and all old stored rows on failure. Only a successful write
advances that currency's `fetchedAt`; manual rows are untouched. The app lifecycle/TanStack integration remains #93.

Transport errors are codes (`network-error`, `not-found`, `http-error`, `invalid-response`), never UI copy.
Lookup reports `storage-error` or `invalid-rate` for unreadable/corrupt storage. No default global fetch, store,
clock, background timer, Supabase or framework dependency is used. Conversion stays in `money.ts`; this module
supplies PLN legs and does not implement another conversion algorithm. Forecast #156 can replace its local
selector with `selectCurrentRates` when the branches are integrated.

## Owner decision: item currencies and frozen history

[2026-10-19 decision](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126):
items have their own currency in MVP; the base currency is locked after onboarding. Forecast uses the latest
cached NBP rate or a newer manual rate. At close, the caller supplies the selected foreign-to-base rates.
Closing snapshots retain each original amount/currency, applied rate and converted base amount, so later quotes
never rewrite history. Rate fetching, cache/manual precedence and onboarding enforcement remain outside #84.
