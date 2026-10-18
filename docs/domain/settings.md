# Settings

Status: **implemented** in `packages/core/src/settings.ts` (#76); the currency fields are typed `CurrencyCode` and
`baseCurrency` (#126).

One local `Settings` model drives every calculation that needs a currency, a warning threshold or the forecast
horizon. No warning threshold or base currency is a constant anywhere else in `packages/core`.

## Model and defaults

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `language` | `"system" \| "pl" \| "en"` | `"system"` | UI language; `"system"` follows the device language (resolved by the app's i18n layer, not by core) |
| `baseCurrency` | `CurrencyCode` | `"PLN"` | Currency all budget amounts are kept in |
| `trackedCurrencies` | `readonly CurrencyCode[]` | `["USD", "EUR", "GBP"]` | Currencies whose exchange rates are tracked ([exchange-rates.md](exchange-rates.md)) |
| `lowBalanceThreshold` | `MinorUnits` | `500_000` (5000 PLN) | Low-balance warning: forecast balance below this amount ([forecast.md](forecast.md)) |
| `largeExpenseThreshold` | `MinorUnits` | `1_000_000` (10000 PLN) | Large-outflow warning: a month's net change lower than minus this amount ([forecast.md](forecast.md)) |
| `forecastHorizonMonths` | integer, 1 to 120 | `13` | Months the forecast projects, including the start month |

Thresholds are in minor units of `baseCurrency`. Changing the currency does not convert them. A threshold of 0
does not turn a warning off: `lowBalanceThreshold: 0` warns only for a balance below 0, and
`largeExpenseThreshold: 0` warns for every month with a negative net change. Whether a warning can be disabled is
decided with the forecast warnings in #6.

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

**Open question (cross-rates, to be decided before #8 and #6):** NBP rates are PLN per unit of a currency
([exchange-rates.md](exchange-rates.md)), so converting tracked currencies into a non-PLN base needs cross-rates.
How to compute them, and what happens to the thresholds when the base currency changes (converted or kept as typed),
go with that decision. Until then, Settings stores the thresholds as typed and does not convert them.

`DEFAULT_SETTINGS` is frozen. All defaults except `language` and `forecastHorizonMonths` come from the legacy
`user_settings` table; the legacy horizon was hardcoded in `use-forecast.ts` (current month + 12) and the legacy
web app defaulted to Polish (the offline app follows the device language, epic #24).

## Renaming `defaultCurrency` to `baseCurrency` (#39, #126)

The legacy setting is called `default_currency`, which suggests an item can pick another one; it cannot – it **is**
the base currency of the budget
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
| `base-currency-tracked` | `trackedCurrencies` | Contains `baseCurrency`: the base currency has no exchange rate against itself. To switch the base to a currently tracked currency, send `baseCurrency` and the new `trackedCurrencies` in one patch. |
| `invalid-threshold` | `lowBalanceThreshold`, `largeExpenseThreshold` | Not a safe integer number of minor units (a fraction, a string, `null`…) |
| `negative-threshold` | `lowBalanceThreshold`, `largeExpenseThreshold` | Below 0 (0 is allowed) |
| `invalid-forecast-horizon` | `forecastHorizonMonths` | Not an integer from 1 to 120 |

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
back to the default, with the base currency removed. The pre-rename
`defaultCurrency` key is an unknown key here: it is dropped and `baseCurrency` keeps its stored value or default.

## Legacy behaviour (`user_settings`, `lib/db.ts`, `use-forecast.ts`)

- `user_settings` has `default_currency` (`PLN`), `tracked_currencies` (`USD`, `EUR`, `GBP`) and
  `low_balance_threshold` (`DECIMAL`, 5000) – there is no large-expense threshold and no horizon.
- `low_balance_threshold` is never read: the forecast hardcodes 5000 and -10000, and the settings panel does not
  show it.
- The NBP client uses a hardcoded currency list instead of `tracked_currencies` (#8).
