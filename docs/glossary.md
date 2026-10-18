# Glossary

Domain terms used across the code and docs. Details are in [domain/](domain/).

| Term | Meaning | Doc |
| --- | --- | --- |
| Minor units / `MinorUnits` | Integer amount in the currency's smallest unit (1 PLN = 100 grosze). | [money](domain/money.md) |
| Item | A budget entry: an expense or an income, one-time or recurring. | [recurrence](domain/recurrence.md) |
| Recurrence | Rule deciding in which months a recurring item is active (target: "every N months from an anchor month", optional end). | [recurrence](domain/recurrence.md) |
| Occurrence | A single month's instance of an item. | [recurrence](domain/recurrence.md) |
| Occurrence override | Change of the amount of, or skipping, one occurrence in one month (`occurrence_overrides`). Replaces the legacy name-based "(nadpisanie)" items. | [occurrence-overrides](domain/occurrence-overrides.md) |
| Payment status | Whether an expense was paid / an income received in a given month. | [forecast](domain/forecast.md) |
| Forecast | Month-by-month projection of the balance (rolling balance, total funds, warnings). | [forecast](domain/forecast.md) |
| Month closing | Closing the active month: record its totals and open the next month with opening balance = closing balance. | [month-closing](domain/month-closing.md) |
| Settings | The single local model of user preferences: language, default and tracked currencies, warning thresholds, forecast horizon. | [settings](domain/settings.md) |
| Settings-driven thresholds | Warning thresholds (low balance, large expense) come from user `Settings`, never constants. | [settings](domain/settings.md) |
| NBP exchange rates | Average rates (table A) from the National Bank of Poland API, cached on the device for offline use. Rates are used exactly as the API returns them (per 1 unit of the currency). | [exchange-rates](domain/exchange-rates.md) |
| `LEGACY:` | Comment marking legacy behaviour kept on purpose in characterization tests, linked to the issue that changes it. | [testing](testing.md) |
