# Settings

Status: **implemented** in `packages/core/src/settings.ts` (#76); the currency fields are typed `CurrencyCode` and
`baseCurrency` (#126).

One local `Settings` model drives every calculation that needs a currency, a warning threshold or the forecast
horizon. No warning threshold or base currency is a constant anywhere else in `packages/core`.

## Model and defaults

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `language` | `"system" \| "pl" \| "en"` | `"system"` | UI language; `"system"` follows the device language (resolved by the app's i18n layer, not by core) |
| `baseCurrency` | `CurrencyCode` | `"PLN"` | Currency of balances, totals and thresholds |
| `trackedCurrencies` | `readonly CurrencyCode[]` | `["USD", "EUR", "GBP"]` | Currencies whose exchange rates are tracked ([exchange-rates.md](exchange-rates.md)) |
| `lowBalanceThreshold` | `MinorUnits` | `500_000` (5000 PLN) | Low-balance warning: forecast balance below this amount ([forecast.md](forecast.md)) |
| `largeExpenseThreshold` | `MinorUnits` | `1_000_000` (10000 PLN) | Large-outflow warning: a month's net change lower than minus this amount ([forecast.md](forecast.md)) |
| `forecastHorizonMonths` | integer, 1 to 120 | `13` | Months the forecast projects, including the start month |
| `rateMaxAgeBusinessDays` | integer, 1 to 20 | `2` | NBP/manual quotes are stale when at least this many business days (Mon–Fri, no Polish holidays) lie strictly between the effective date and today (#8) |

Thresholds are in minor units of `baseCurrency`. `baseCurrency` is chosen in the onboarding wizard and **locked once
onboarding is confirmed** ([owner decision, 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126)).
Before that confirmation it can still change freely; afterwards there is no base-currency change at all, so
thresholds are never converted, which closes the threshold-conversion question left open by #24 and #124. Picking a
different base while preparing settings during onboarding does not convert them either: they stay as typed, in the
base currency the user settles on. Rejecting a base-currency patch after the confirmation is the lock of #139: the
`Settings` value model here has no onboarding lifecycle state, so until #139 lands the app and the persistence layer
must reject the change. A threshold of 0 does not turn a warning off: `lowBalanceThreshold: 0` warns only for a
balance below 0, and `largeExpenseThreshold: 0` warns for every month with a negative net change. Disabling warnings
is not supported: #6 keeps zero thresholds active.

The maximum horizon is `MAX_FORECAST_HORIZON_MONTHS` (120 months, 10 years), so a corrupted stored value cannot make
the forecast build an unbounded number of months.

`baseCurrency` is the budget's base currency and is not limited to PLN
([owner decision](https://github.com/alimek/budget-lens-offline/pull/121#issuecomment-6254392885)). Both
`baseCurrency` and `trackedCurrencies` are typed `CurrencyCode` (#126), the **supported currencies**: PLN or a
currency of NBP table A except XDR, i.e. the codes of the exponent table in `packages/core/src/currency.ts`
(`isCurrencyCode`), so every stored code can be formatted and parsed ([money.md](money.md)). Arbitrary ISO 4217
codes with manually entered rates are out of scope
([owner decision](https://github.com/alimek/budget-lens-offline/pull/117#issuecomment-6254596752),
which narrows the earlier "any base currency" decision).

**Cross-rates go via PLN.** Decided in #124
([owner review 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950)). Items
may have their own supported currency (#138), so the forecast (#6) converts each occurrence into `baseCurrency`. NBP
quotes 1 unit of a currency in PLN ([exchange-rates.md](exchange-rates.md)), so a non-PLN base gets no NBP quote of
its own: every conversion goes through PLN, the implicit hub with `mid_PLN = 1`, as
`toMinor = roundHalfAwayFromZero(amountMinor × midFrom × 10^(expTo − expFrom) / midTo)`, where `midX` is the PLN
value of 1 unit of X and `expX` its ISO 4217 exponent ([money.md](money.md)). `convertViaPln` picks both PLN legs
and `convertMinorExact` computes them in one exact decimal calculation with **one** rounding step, half away from
zero. Rounding an intermediate PLN amount or a pre-computed cross-rate is not allowed: double rounding can be off by
a minor unit. Rates are **decimal strings** (`mid`, e.g. `"4.0123"`), never floating-point numbers. The supported
currencies above are PLN plus NBP table A only, so both legs always come from that one table. The forecast picks the
quote itself from the current candidates it is given (at most one `nbp` and one `manual` `1 X = y PLN` quote per
currency, each with a validated `effectiveDate`): the one with the newer `effectiveDate` wins, and **manual wins a
tie** (#39). Thresholds stay as typed in base-currency minor units; there is no base-change conversion flow. Closing
(#84) still receives caller-selected rates and stores the converted totals with them; #141 moves it onto the same
contract ([month-closing.md](month-closing.md)). See also [forecast.md](forecast.md).

NBP and manual rates are PLN per unit of a currency. `selectCurrentRates` (#8) chooses the newer effective date,
preferring manual on a tie; cross rates go via PLN. Freshness counts business days against `rateMaxAgeBusinessDays`
for both sources ([Orchestrator decision 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/8#issuecomment-6277037751); see [exchange-rates.md](exchange-rates.md)).
Business days are Mon–Fri; Polish public holidays are **not** modelled in the MVP (the default of 2 absorbs one
holiday; follow-up [#165](https://github.com/alimek/budget-lens-offline/issues/165)). `rateMaxAgeBusinessDays`
replaces the earlier `rateMaxAgeHours` (24): `loadSettings` drops a stored `rateMaxAgeHours` and an invalid or
missing `rateMaxAgeBusinessDays` falls back to `2`. The upper bound `MAX_RATE_MAX_AGE_BUSINESS_DAYS` (20, four
working weeks) keeps a corrupted value from hiding stale rates. The base currency cannot change after onboarding.

`DEFAULT_SETTINGS` is frozen. All defaults except `language`, `forecastHorizonMonths` and `rateMaxAgeBusinessDays` come from the legacy
`user_settings` table; the legacy horizon was hardcoded in `use-forecast.ts` (current month + 12) and the legacy
web app defaulted to Polish (the offline app follows the device language, epic #24).

## Renaming `defaultCurrency` to `baseCurrency` (#39, #126)

The legacy setting is called `default_currency`; the offline model calls it the base currency of the budget
([#39 research, open question 1](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6254390483),
default "yes"). So the field is `baseCurrency`, the validation error code is `base-currency-tracked`, and the schema
of #35 must use a `base_currency` column (the #35 research comment still says `default_currency`). The rename and the `CurrencyCode` typing landed in one change so Settings was not
churned twice. There is no migration: the offline app has no released stored settings yet and no `*FromLegacy` helper
reads the old key.

## Updating and loading

`updateSettings(current, changes)` merges `changes` into `current`, validates the result and returns
`{ ok: true, settings }` (a new frozen object; `current` is never mutated) or `{ ok: false, errors }` with **every**
invalid field. Errors are codes for the UI to translate, never messages:

| Code | Field(s) | When |
| --- | --- | --- |
| `invalid-language` | `language` | Not `system`, `pl` or `en` |
| `invalid-currency` | `baseCurrency`, `trackedCurrencies` | Not a string of three uppercase letters; for `trackedCurrencies`, not an array of such strings |
| `unsupported-currency` | `baseCurrency`, `trackedCurrencies` | A well-formed code that is not a supported currency (e.g. `BGN`, `XAU`); for `trackedCurrencies`, any such element |
| `duplicate-currency` | `trackedCurrencies` | The same code twice |
| `base-currency-tracked` | `trackedCurrencies` | Contains `baseCurrency`: the base currency has no exchange rate against itself. During onboarding, to choose a currently tracked currency as base, send `baseCurrency` and the new `trackedCurrencies` in one patch. |
| `invalid-threshold` | `lowBalanceThreshold`, `largeExpenseThreshold` | Not a safe integer number of minor units (a fraction, a string, `null`…) |
| `negative-threshold` | `lowBalanceThreshold`, `largeExpenseThreshold` | Below 0 (0 is allowed) |
| `invalid-forecast-horizon` | `forecastHorizonMonths` | Not an integer from 1 to 120 |
| `invalid-rate-max-age` | `rateMaxAgeBusinessDays` | Not an integer number of business days from 1 to 20 |

Errors name the field, not the element: one `trackedCurrencies` error covers the whole list, which fits a currency
picker that shows one message per field. `updateSettings` checks every field at runtime, so a value of the wrong
type is an error, never a thrown `TypeError`. The `CurrencyCode` types do not narrow stored data on their own:
`currencyError` and `trackedCurrenciesError` do that with `isCurrencyCode` ([money.md](money.md)). Stored data goes
through `loadSettings` and user input is checked with `isCurrencyCode` before it reaches `updateSettings`; the
`as Partial<Settings>` cast is only for tests that feed invalid values. Never assume a plain `string` is a code.

`loadSettings(stored)` keeps valid stored fields, uses defaults for missing or invalid fields, drops unknown
keys and returns frozen settings; non-object values and arrays return `DEFAULT_SETTINGS`. The loaded base
currency is removed from the stored tracked list before validation, preserving the remaining valid choices
(e.g. `baseCurrency: "USD"` with `["USD", "EUR"]` keeps `["EUR"]`). Lists with other invalid entries still fall
back to the default, with the base currency removed. An empty tracked list is valid (`["USD"]` with base `USD`
loads as `[]`). The pre-rename
`defaultCurrency` key is an unknown key here: it is dropped and `baseCurrency` keeps its stored value or default.

Per-item currencies are now in MVP ([owner decision](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126)),
superseding the earlier base-only item assumption in #39. Items retain their own currency; forecast/closing convert
into the locked base currency. See [month-closing.md](month-closing.md) for the rate snapshot contract.

## Legacy behaviour (`user_settings`, `lib/db.ts`, `use-forecast.ts`)

- `user_settings` has `default_currency` (`PLN`), `tracked_currencies` (`USD`, `EUR`, `GBP`) and
  `low_balance_threshold` (`DECIMAL`, 5000) – there is no large-expense threshold and no horizon.
- `low_balance_threshold` is never read: the forecast hardcodes 5000 and -10000, and the settings panel does not
  show it.
- The NBP client uses a hardcoded currency list instead of `tracked_currencies` (#8).
