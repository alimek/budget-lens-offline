# Glossary

Domain terms used across the code and docs. Details are in [domain/](domain/).

| Term | Meaning | Doc |
| --- | --- | --- |
| Minor units / `MinorUnits` | Integer amount in the currency's smallest unit (1 PLN = 100 grosze). | [money](domain/money.md) |
| Item | A budget entry: an expense or an income, one-time or recurring. | [recurrence](domain/recurrence.md) |
| Recurrence | Rule deciding in which months a recurring item is active ("every N months from an anchor month", optional end month). | [recurrence](domain/recurrence.md) |
| Occurrence | A single month's instance of an item (`{ month, day? }`). | [recurrence](domain/recurrence.md) |
| `YearMonth` | A calendar month written as `YYYY-MM`; the only month format in the domain. | [recurrence](domain/recurrence.md) |
| Schedule | One-time (`month`) or recurring (`intervalMonths`, `anchor`, optional `endMonth` and `dayOfMonth`) rule of an item. | [recurrence](domain/recurrence.md) |
| Occurrence override | Change of the amount of, or skipping, one occurrence in one month (`occurrence_overrides`). Replaces the legacy name-based "(nadpisanie)" items. | [occurrence-overrides](domain/occurrence-overrides.md) |
| Payment status | Whether an expense was paid / an income received for `(itemType, itemId, month)`; missing means unsettled. | [month-closing](domain/month-closing.md) |
| Forecast | Month-by-month projection of the balance (rolling balance, total funds, warnings). | [forecast](domain/forecast.md) |
| Month closing | Closing the active month: record its totals and open the next month with opening balance = closing balance. | [month-closing](domain/month-closing.md) |
| Base currency | The currency of balances, totals and thresholds; items may use their own supported currency (`Settings.baseCurrency`, the legacy `default_currency`, typed `CurrencyCode`). | [settings](domain/settings.md) |
| Supported currency | A `CurrencyCode`: PLN or a currency of NBP table A except XDR, i.e. the codes of the exponent table in `packages/core/src/currency.ts`. | [money](domain/money.md) |
| Settings | The single local model of user preferences: language, base and tracked currencies, warning thresholds, forecast horizon. | [settings](domain/settings.md) |
| Settings-driven thresholds | Warning thresholds (low balance, large expense) come from user `Settings`, never constants. | [settings](domain/settings.md) |
| NBP exchange rates | Average rates (table A) from the National Bank of Poland API, cached on the device for offline use. Rates are used exactly as the API returns them (per 1 unit of the currency). | [exchange-rates](domain/exchange-rates.md) |
| `LEGACY:` | Comment marking legacy behaviour kept on purpose in characterization tests, linked to the issue that changes it. | [testing](testing.md) |
