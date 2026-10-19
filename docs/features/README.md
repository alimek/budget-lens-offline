# Feature PRDs

Short product requirement documents, one per MVP epic. Each PRD states the problem, the goal, the scope, user
stories, high-level acceptance criteria, success criteria, dependencies and open questions. Detailed acceptance
criteria live in the linked issues; domain rules live in [../domain/](../domain/). Update a PRD when the owner changes
the scope of its epic.

**Status line.** `approved` means the decisions the PRD relies on were approved by Grzegorz in issue comments, which
the status line links. `proposed` means research questions for the epic are still open, so the PRD is a draft until
they are answered. Numbers in the success criteria (times, item counts) are **proposed targets**, not recorded decisions.

Product principles that every PRD follows: data stays on the device (encrypted SQLite), backup/restore only through
the user's own iCloud / Google Drive, no Budget Lens server, no accounts, one-time license, MIT core, Polish and
English.

Multi-currency
([owner decision, 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126)): every item has its own currency (PLN or NBP table A) and is converted to
the base currency at the latest cached NBP rate (or a newer manual rate). The base currency is chosen in onboarding
and locked once onboarding is confirmed. At month close, the rate used for each foreign-currency occurrence is
snapshotted, so closed months never change.

Other owner decisions of 2026-10-19 reflected in the PRDs:
- Navigation: the Dashboard (**Overview**) is the first, main tab ([#36 Q1](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263044426)). Tab bar Variant A,
  [chosen by @alimek on #36](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530): Overview, Month, Forecast, Items, Settings (Expo Router `NativeTabs`). Savings is
  a screen opened from a card on Overview, not a tab.
- English is the source language; no translation checks in CI; missing keys fall back to English ([#37](https://github.com/alimek/budget-lens-offline/issues/37)).
- App lock (biometric/PIN) is post-MVP ([#34](https://github.com/alimek/budget-lens-offline/issues/34)).
- Owner review 2026-10-19: the remaining research defaults of [#34](https://github.com/alimek/budget-lens-offline/issues/34)–[#40](https://github.com/alimek/budget-lens-offline/issues/40) and [#124](https://github.com/alimek/budget-lens-offline/issues/124) are accepted, with two
  changes: rates are fetched **on app open** when a newer NBP table may exist (at most hourly retries before it is published); NBP/manual quotes become stale when at least `Settings.rateMaxAgeBusinessDays` business days (Mon–Fri, default 2, no Polish holidays in the MVP) lie between the effective date and today ([Orchestrator decision 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/8#issuecomment-6277037751), superseding the 24 h and fetch-age rules). Offline the last stored rate is used; **only the current rate per currency is stored** (no rate history) ([owner review #124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950), [owner review #35, Q7](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)). The rate used at month close stays in the closed-month snapshot ([#141](https://github.com/alimek/budget-lens-offline/issues/141)).
- Backup direction: an encrypted file whose key is stored automatically in the platform's synced secret store; an
  optional recovery code only for switching platforms ([#48](https://github.com/alimek/budget-lens-offline/issues/48)).
- Backup ([owner review #48](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263841345)): on by default with no prompt or nudge; once a day on app open plus a
  "Back up now" button; no background backup in MVP. Android has one "Enable backup to Google Drive" consent step in
  onboarding; iOS has none. Retention: the last 5 backups plus one per closed month (at most 12). NBP rates are not
  backed up; manual rates are.
- Categories and tags are not in MVP; they come in v1.1 ([owner decision #41](https://github.com/alimek/budget-lens-offline/issues/41#issuecomment-6263792895)). Items are grouped by kind.
- Owner-confirmed 2026-10-19 (chat): at most one current NBP rate plus one current manual rate per currency
  ([#92](https://github.com/alimek/budget-lens-offline/issues/92#issuecomment-6276227995)); an item's currency is fixed after creation ([#81](https://github.com/alimek/budget-lens-offline/issues/81#issuecomment-6276228839)).

| Epic | PRD |
| --- | --- |
| E1 [#23](https://github.com/alimek/budget-lens-offline/issues/23) App shell & encrypted local storage | [app-shell-storage.md](app-shell-storage.md) |
| E2 [#24](https://github.com/alimek/budget-lens-offline/issues/24) Money, localization (PL/EN) & settings | [money-i18n-settings.md](money-i18n-settings.md) |
| E3 [#25](https://github.com/alimek/budget-lens-offline/issues/25) Budget items & recurrence | [budget-items-recurrence.md](budget-items-recurrence.md) |
| E4 [#26](https://github.com/alimek/budget-lens-offline/issues/26) Month view, payment status & overrides | [month-view-overrides.md](month-view-overrides.md) |
| E5 [#27](https://github.com/alimek/budget-lens-offline/issues/27) Balance & month closing | [month-closing.md](month-closing.md) |
| E6 [#28](https://github.com/alimek/budget-lens-offline/issues/28) Forecast, warnings & dashboard | [forecast-warnings.md](forecast-warnings.md) |
| E8 [#30](https://github.com/alimek/budget-lens-offline/issues/30) Backup & restore via the user's iCloud / Google Drive | [cloud-backup.md](cloud-backup.md) |

## Epics without a PRD

- **E7 Savings & currencies ([#29](https://github.com/alimek/budget-lens-offline/issues/29))**: P2 and not an MVP epic; `epic-plan.md` plans it as "MVP-optional (right
  after the MVP)". Only its rate tasks are pulled into the MVP, because per-item currency needs them: the NBP client
  ([#8](https://github.com/alimek/budget-lens-offline/issues/8)), rates storage ([#92](https://github.com/alimek/budget-lens-offline/issues/92)), rate refresh ([#93](https://github.com/alimek/budget-lens-offline/issues/93)) and manual rates ([#144](https://github.com/alimek/budget-lens-offline/issues/144), [#145](https://github.com/alimek/budget-lens-offline/issues/145)).
  The E2, E3, E4, E5 and E6 PRDs cover those requirements. A PRD for savings follows when the epic is scheduled.
- **E9 One-time license ([#31](https://github.com/alimek/budget-lens-offline/issues/31))**: P2, planned "before public launch", not MVP. Its scope depends on open
  research: store IAP rules vs Paddle/Stripe ([#52](https://github.com/alimek/budget-lens-offline/issues/52)), offline license verification ([#53](https://github.com/alimek/budget-lens-offline/issues/53)) and pricing
  ([#12](https://github.com/alimek/budget-lens-offline/issues/12), P3). A PRD follows once those are answered.
