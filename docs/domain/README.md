# Domain

One file per domain area. Each file states what is **implemented** in `packages/core`, the **legacy** behaviour of
[`alimek/budget-lens`](https://github.com/alimek/budget-lens) (private) being ported, and the **target** behaviour
decided in the linked issue. Update the file in the same PR that changes the behaviour.

- [money.md](money.md) – `MinorUnits`, parsing, formatting (#2)
- [recurrence.md](recurrence.md) – recurring and one-time items (#4)
- [occurrence-overrides.md](occurrence-overrides.md) – per-month overrides (#5)
- [forecast.md](forecast.md) – balance forecast and warnings (#6)
- [month-closing.md](month-closing.md) – closing a month (#84)
- [settings.md](settings.md) – `Settings` model, defaults and warning thresholds (#76)
- [exchange-rates.md](exchange-rates.md) – NBP exchange rates with offline cache (#8)

Months are written as `YYYY-MM` in the target model.
