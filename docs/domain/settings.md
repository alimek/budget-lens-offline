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
| `forecastHorizonMonths` | integer | `13` | Months the forecast projects, including the start month |

Thresholds are in minor units of `defaultCurrency`. Changing the currency does not convert them.

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
| `invalid-currency` | `defaultCurrency`, `trackedCurrencies` | Not three uppercase letters |
| `duplicate-currency` | `trackedCurrencies` | The same code twice |
| `negative-threshold` | `lowBalanceThreshold`, `largeExpenseThreshold` | Below 0 (0 is allowed) |
| `invalid-forecast-horizon` | `forecastHorizonMonths` | Not an integer of at least 1 |

Stored settings are loaded the same way: `updateSettings(DEFAULT_SETTINGS, stored)`, so missing fields get the
defaults.

## Legacy behaviour (`user_settings`, `lib/db.ts`, `use-forecast.ts`)

- `user_settings` has `default_currency` (`PLN`), `tracked_currencies` (`USD`, `EUR`, `GBP`) and
  `low_balance_threshold` (`DECIMAL`, 5000) – there is no large-expense threshold and no horizon.
- `low_balance_threshold` is never read: the forecast hardcodes 5000 and -10000, and the settings panel does not
  show it.
- The NBP client uses a hardcoded currency list instead of `tracked_currencies` (#8).
