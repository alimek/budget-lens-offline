# Feature PRDs

Short product requirement documents, one per MVP epic. Each PRD states the problem, the goal, the scope, user
stories, high-level acceptance criteria, success criteria, dependencies and open questions. Detailed acceptance
criteria live in the linked issues; domain rules live in [../domain/](../domain/). Update a PRD when the owner changes
the scope of its epic.

Product principles that every PRD follows: data stays on the device (encrypted SQLite), backup/restore only through
the user's own iCloud / Google Drive, no Budget Lens server, no accounts, one-time license, MIT core, Polish and
English.

Multi-currency
([owner decision, 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126)): every item has its own currency (PLN or NBP table A) and is converted to
the base currency at the latest cached NBP rate (or a newer manual rate). The base currency is chosen in onboarding
and locked once onboarding is confirmed. At month close, the rate used for each foreign-currency occurrence is
snapshotted, so closed months never change.

| Epic | PRD |
| --- | --- |
| E1 [#23](https://github.com/alimek/budget-lens-offline/issues/23) App shell & encrypted local storage | [app-shell-storage.md](app-shell-storage.md) |
| E2 [#24](https://github.com/alimek/budget-lens-offline/issues/24) Money, localization (PL/EN) & settings | [money-i18n-settings.md](money-i18n-settings.md) |
| E3 [#25](https://github.com/alimek/budget-lens-offline/issues/25) Budget items & recurrence | [budget-items-recurrence.md](budget-items-recurrence.md) |
| E4 [#26](https://github.com/alimek/budget-lens-offline/issues/26) Month view, payment status & overrides | [month-view-overrides.md](month-view-overrides.md) |
| E5 [#27](https://github.com/alimek/budget-lens-offline/issues/27) Balance & month closing | [month-closing.md](month-closing.md) |
| E6 [#28](https://github.com/alimek/budget-lens-offline/issues/28) Forecast, warnings & dashboard | [forecast-warnings.md](forecast-warnings.md) |
| E8 [#30](https://github.com/alimek/budget-lens-offline/issues/30) Backup & restore via the user's iCloud / Google Drive | [cloud-backup.md](cloud-backup.md) |
