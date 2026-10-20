# Exchange rates (NBP)

Status: the injected NBP client/cache is **implemented** (#8). Exact minor-unit conversion (`convertMinor`) and
caller-supplied rates in closing snapshots are implemented in #84. Forecast uses shared conversion through
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
202/A/NBP/2026 of 2026-10-16: JPY `mid` = 0.024574). No multiplier is applied. `src/exchange-rates.test.ts` checks
the recorded JPY response and converts 10,000 yen to 24,574 grosze with the existing `convertMinor`.

**Correction.** An earlier assumption that NBP quotes some currencies (e.g. JPY, HUF) in a different unit was wrong;
rates are per 1 unit ([#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427)). The characterization tests
(#3, merged in #19) use the per-unit rate
(JPY fixture `mid: 0.024574`).

## Client, current-rate store and lookup (#8)

- `fetchNbpRate(currency, fetchFn, { timeoutMs? })` – table A, response validation, network and 404 errors; `fetch`
  is injected as `NbpFetch = (url, { signal }) => …` (the global `fetch` fits as is).
- An injected `RateStore` cache (`get`, `set`, `getAll`); in-memory implementation in core for tests, SQLite in the app.
- `getRate(currency, { store, today, maxAgeBusinessDays })` only reads storage. `today` is the **Europe/Warsaw**
  `YYYY-MM-DD` (`warsawDate(new Date())`, see below), supplied by the app, and `maxAgeBusinessDays` comes from `Settings.rateMaxAgeBusinessDays` (default 2). It returns
  `mid`, `effectiveDate`, `source` and `stale`, or an error code such as `missing-rate`. It never fetches, including
  when offline/stale. A malformed stored row is skipped, so a valid row of the other source is still used;
  `invalid-rate` is returned only when no valid row remains.
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
The SQLite table for the adapter is `exchange_rates` in `packages/db` (#74), with primary key `(currency, source)`.

`selectCurrentRates` is the shared, generic selector for lookup and other consumers (including forecast #156):
the newer effective date wins; manual wins equal dates, independently of candidate order. It accepts already
validated candidates and preserves their metadata. This follows the
[decision on #8](https://github.com/alimek/budget-lens-offline/issues/8#issuecomment-6276832887):
for NBP use the table date; for manual use the date entered by the user.

**Freshness is measured in business days** ([decision on #8, 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/8#issuecomment-6277037751), superseding the 24 h
effective-date rule and the earlier successful-fetch-age rule). `businessDaysBetween(effectiveDate, today)` counts the
Mon–Fri calendar days strictly between the two dates (both excluded). Both NBP and manual quotes are stale when that
count is at least `Settings.rateMaxAgeBusinessDays` (default 2), i.e. when the effective date is older than 2 business
days before today. Dates are `YYYY-MM-DD` compared as UTC calendar days, without reading the clock or depending on the
host timezone.

**`today` is Warsaw's date.** NBP's `effectiveDate` is a Europe/Warsaw business date, so freshness and the refresh
gate both compare it with Warsaw's calendar date, not the device's. `warsawDate(instant)` is a pure helper that
uses **no `Intl`** (Hermes on iOS has no reliable `formatToParts`; see
[ADR 0012](../decisions/0012-native-intl-money-formatting.md)). It applies the EU summer-time rule (Directive
2000/84/EC) with UTC arithmetic: UTC+2 (CEST) from 01:00 UTC on the last Sunday of March until 01:00 UTC on the last
Sunday of October, UTC+1 (CET) otherwise (`warsawUtcOffsetHours`), then takes the UTC date of the shifted instant.
Nothing runs at module load, and the result is the same on Hermes, Node and any device time zone. The rule is
hard-coded: revisit it if the directive changes (e.g. if the EU abolishes seasonal clock changes). `refreshNbpRates` derives it from its
`now`; the app passes `warsawDate(new Date())` as `getRate`'s `today` (#93). So a device east of Warsaw does not see
the next weekday (and retry hourly for a table that cannot exist yet) before Warsaw does, and a device far east or
west never flags the latest table as stale early. Manual rates keep the date the user entered in their own
calendar; in time zones far from Warsaw that date can differ by up to one day from the Warsaw date of the same
moment, which can shift a manual-vs-NBP tie or a manual quote's staleness by one day. This is accepted for the MVP.

**Polish public holidays are not modelled in the MVP**: every Mon–Fri is a business day. The default of 2 absorbs one
holiday; two adjacent holidays can flag the latest NBP rate as stale. Follow-up:
[#165](https://github.com/alimek/budget-lens-offline/issues/165).

| effectiveDate | today | Mon–Fri strictly between | Default result |
| --- | --- | --- | --- |
| Fri | Sat, Sun, Mon (also Mon 07:00, before Monday's table) | 0 | fresh |
| Thu | Mon | 1 | fresh |
| Mon | Wed (exactly 2 business days old, boundary) | 1 | fresh |
| Wed | Mon (3 business days old) | 2 | stale |
| Wed | Sat | 2 | stale |

Manual rates are also `1 X = y PLN`; `fetchedAt` never decides precedence or staleness.

`refreshNbpRates(currencies, { store, fetchFn, now, timeoutMs? })` is an explicit app-open operation, separate from
lookup. Here `now` is injected epoch milliseconds (`Date.now()`); option names are consistent: `now` is always an
instant in epoch ms, `today` always a Warsaw `YYYY-MM-DD`. A currency is **due** when a business day (Mon–Fri) lies
after its cached NBP `effectiveDate`, up to and including Warsaw's today (`warsawDate(new Date(now))`, so a newer
table may exist), and the row was not fetched within the last hour. So Friday's table is not
refetched at the weekend; a fetch on a weekday morning before NBP publishes (around midday) is retried at most hourly
and picks up the new table the same day, instead of after a fixed 24 h gate. Due currencies are fetched with one
`fetchNbpRates` table-A request. `fetchNbpRate` remains available for a single latest
quote; neither function requests history or the `/today/` endpoint. They use HTTPS and validate the response per
the [NBP API contract](https://api.nbp.pl/en.html). Quotes keep decimal `mid` strings without per-100 scaling;
small exponent-form JSON numbers are expanded without rounding. Missing/malformed quotes and failed writes are
reported per currency, preserving other successes and all old stored rows on failure. Only a successful write
advances that currency's `fetchedAt`; manual rows are untouched. A response whose `effectiveDate` is older than the
cached NBP row (e.g. a stale proxy or CDN) never replaces it: the cached row is kept and only its `fetchedAt`
advances, for the retry throttle. The app lifecycle/TanStack integration remains #93.

Every NBP request is **cancelled** after `timeoutMs` (default `NBP_TIMEOUT_MS`, 10 s): each request gets its own
`AbortController`, its `signal` is passed to `fetchFn`, and the timer aborts it, which also cancels the body read
(`response.json()`) of that request. The timer is cleared in `finally`. An abort (`AbortError`) or the deadline maps
to `network-error`, so app open is never blocked and no connection is left open. A `fetchFn` that ignores the signal
is still raced against the same deadline.

Transport errors are codes (`network-error`, `not-found`, `http-error`, `invalid-response`), never UI copy.
Lookup reports `storage-error` or `invalid-rate` for unreadable/corrupt storage. No default global fetch, store,
clock, background timer, Supabase or framework dependency is used. Conversion stays in `money.ts`; this module
supplies PLN legs and does not implement another conversion algorithm. Forecast and lookup both use
`selectCurrentRates`; no separate forecast selection rule remains.

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
supersede the early research: table A only, current rates only, fetch on app open (gated by the newest possible
table date, see above), freshness in business days against the Settings threshold (latest #8 decision above). Manual rates are PLN-quoted; the forecast uses the
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
