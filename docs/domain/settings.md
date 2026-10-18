# Settings

Status: **implemented** in `packages/core/src/settings.ts` (#76).

One local `Settings` model drives every calculation that needs a currency, a warning threshold or the forecast
horizon. No warning threshold or default currency is a constant anywhere else in `packages/core`.

## Model and defaults

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `language` | `"system" \| "pl" \| "en"` | `"system"` | UI language; `"system"` follows the device language (resolved by the app's i18n layer, not by core) |
| `defaultCurrency` | ISO 4217 code | `"PLN"` | Currency all budget amounts are kept in |
| `trackedCurrencies` | ISO 4217 codes | `["USD", "EUR", "GBP"]` | Currencies whose exchange rates are tracked ([exchange-rates.md](exchange-rates.md)) |
| `lowBalanceThreshold` | `MinorUnits` | `500_000` (5000 PLN) | Low-balance warning: forecast balance below this amount ([forecast.md](forecast.md)) |
| `largeExpenseThreshold` | `MinorUnits` | `1_000_000` (10000 PLN) | Large-outflow warning: a month's net change lower than minus this amount ([forecast.md](forecast.md)) |
| `forecastHorizonMonths` | integer, 1 to 120 | `13` | Months the forecast projects, including the start month |

Thresholds are in minor units of `defaultCurrency`. Changing the currency does not convert them. A threshold of 0
does not turn a warning off: `lowBalanceThreshold: 0` warns only for a balance below 0, and
`largeExpenseThreshold: 0` warns for every month with a negative net change. Whether a warning can be disabled is
decided with the forecast warnings in #6.

The maximum horizon is `MAX_FORECAST_HORIZON_MONTHS` (120 months, 10 years), so a corrupted stored value cannot make
the forecast build an unbounded number of months.

`defaultCurrency` is the budget's base currency and may be any currency, not only PLN
([owner decision](https://github.com/alimek/budget-lens-offline/pull/121#issuecomment-6254392885)).

**Open question (cross-rates, to be decided before #8 and #6):** NBP rates are PLN per unit of a currency
([exchange-rates.md](exchange-rates.md)), so converting tracked currencies into a non-PLN base needs cross-rates.
How to compute them, and what happens to the thresholds when the base currency changes (converted or kept as typed),
go with that decision. Until then, Settings stores the thresholds as typed and does not convert them.

`DEFAULT_SETTINGS` is frozen. All defaults except `language` and `forecastHorizonMonths` come from the legacy
`user_settings` table; the legacy horizon was hardcoded in `use-forecast.ts` (current month + 12) and the legacy
web app defaulted to Polish (the offline app follows the device language, epic #24).

## Updating and loading

`updateSettings(current, changes)` merges `changes` into `current`, validates the result and returns
`{ ok: true, settings }` (a new frozen object; `current` is never mutated) or `{ ok: false, errors }` with **every**
invalid field. Errors are codes for the UI to translate, never messages:

| Code | Field(s) | When |
| --- | --- | --- |
| `invalid-language` | `language` | Not `system`, `pl` or `en` |
| `invalid-currency` | `defaultCurrency`, `trackedCurrencies` | Not a string of three uppercase letters; for `trackedCurrencies`, not an array of such strings |
| `duplicate-currency` | `trackedCurrencies` | The same code twice |
| `default-currency-tracked` | `trackedCurrencies` | Contains `defaultCurrency`: the base currency has no exchange rate against itself (NBP table A has no PLN rate) |
| `invalid-threshold` | `lowBalanceThreshold`, `largeExpenseThreshold` | Not a safe integer number of minor units (a fraction, a string, `null`…) |
| `negative-threshold` | `lowBalanceThreshold`, `largeExpenseThreshold` | Below 0 (0 is allowed) |
| `invalid-forecast-horizon` | `forecastHorizonMonths` | Not an integer from 1 to 120 |

Errors name the field, not the element: one `trackedCurrencies` error covers the whole list, which fits a currency
picker that shows one message per field.

Stored settings are loaded the same way: `updateSettings(DEFAULT_SETTINGS, stored)`, so missing fields get the
defaults. `stored` is treated as untrusted: every field is checked at runtime, a value of the wrong type is an error
(never a thrown `TypeError`), and keys that are not `Settings` fields (e.g. legacy `low_balance_threshold`) are
dropped.

## Legacy behaviour (`user_settings`, `lib/db.ts`, `use-forecast.ts`)

- `user_settings` has `default_currency` (`PLN`), `tracked_currencies` (`USD`, `EUR`, `GBP`) and
  `low_balance_threshold` (`DECIMAL`, 5000) – there is no large-expense threshold and no horizon.
- `low_balance_threshold` is never read: the forecast hardcodes 5000 and -10000, and the settings panel does not
  show it.
- The NBP client uses a hardcoded currency list instead of `tracked_currencies` (#8).
