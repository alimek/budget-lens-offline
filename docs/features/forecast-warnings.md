# PRD: Forecast, warnings & dashboard (E6)

Epic: [#28](https://github.com/alimek/budget-lens-offline/issues/28) · Status: proposed (open: [#44](https://github.com/alimek/budget-lens-offline/issues/44), [#45](https://github.com/alimek/budget-lens-offline/issues/45), [#46](https://github.com/alimek/budget-lens-offline/issues/46)) · decisions: [#36 Q1](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263044426), [#36 tabs](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530), [#124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950), [#35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802) · MVP

## Problem

People want to know months ahead whether their balance will drop too low, including the effect of bills in other
currencies.

## Goal

A forecast over a configurable horizon (default from `Settings`) of the rolling balance and total funds, **in the base
currency**. Foreign-currency items are converted at the latest cached NBP rate (or a newer manual rate), and the UI
shows which rates were used. Warnings (negative, low balance, large expense) use `Settings` thresholds. The **Dashboard (Overview tab) is
the first, main tab** of the app and summarizes it ([#36 Q1](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263044426)). Tabs follow [Variant A, chosen by @alimek](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530):
Overview, Month, Forecast, Items, Settings. Overview links to the full **Forecast** tab and has a **Savings** card that
opens the savings screen (E7); Savings is not a tab.

## Scope

**In:**
- Forecast core ([#6](https://github.com/alimek/budget-lens-offline/issues/6)).
- Foreign-currency conversion ([#140](https://github.com/alimek/budget-lens-offline/issues/140)).
- Forecast hook ([#88](https://github.com/alimek/budget-lens-offline/issues/88)), forecast screen with chart ([#89](https://github.com/alimek/budget-lens-offline/issues/89)), dashboard ([#90](https://github.com/alimek/budget-lens-offline/issues/90)).
- Optional local notifications ([#91](https://github.com/alimek/budget-lens-offline/issues/91)).

**Out:**
- Server push notifications.
- Cloud or AI predictions.
- Live rate streaming.

## User stories

- As a user, I see my projected balance for each of the next 12 months.
- As a user, I get a warning when a month is projected below my low-balance threshold.
- As a user with a USD subscription, I see it included in base-currency terms, with the rate date and a stale badge
  when the quote's effective-date age reaches the Settings threshold (24 h by default).
- As a user, I open the app on Overview (the Dashboard, first tab) and see my balance, the next warning, a mini
  forecast and a Savings card.

## Acceptance criteria (high level)

- The forecast is a pure, deterministic core function; all amounts in the output are in the base currency.
- Conversion uses the #124 strategy (one rounding, half away from zero). A missing rate gives a translatable
  warning, never a silent 0.
- Closed months use snapshotted rates; only open and future months use current rates.
- The chart uses full amounts (optionally whole units), with no compact axis labels such as "5K" / "5 tys."
  ([ADR 0012](../decisions/0012-native-intl-money-formatting.md)).
- Rates: rates are fetched **once a day on app open**; both sources become stale when effective-date age reaches `Settings.rateMaxAgeHours` (24 by default), per the [latest #8 decision](https://github.com/alimek/budget-lens-offline/issues/8#issuecomment-6276832887), which supersedes fetch-age freshness. Offline the last stored rate is used; **only the current rate per currency is stored** (no rate history) ([owner review #124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950), [owner review #35, Q7](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)). Manual rates (`1 X = y PLN`) win on a newer or equal effective date; cross rates go via PLN; table A only. At most one current NBP rate plus one current manual rate is kept per
  currency (owner-confirmed 2026-10-19, [#92](https://github.com/alimek/budget-lens-offline/issues/92#issuecomment-6276227995)).

## Success criteria

- Proposed target: the forecast for a 30-item, 3-currency budget computes in under 50 ms on device.
- Warnings match the thresholds in characterization and unit tests.

## Dependencies

- Core: [#6](https://github.com/alimek/budget-lens-offline/issues/6), [#140](https://github.com/alimek/budget-lens-offline/issues/140), [#8](https://github.com/alimek/budget-lens-offline/issues/8), [#124](https://github.com/alimek/budget-lens-offline/issues/124).
- Rates storage and refresh (E7, now an MVP prerequisite): [#92](https://github.com/alimek/budget-lens-offline/issues/92), [#93](https://github.com/alimek/budget-lens-offline/issues/93).
- DB: [#85](https://github.com/alimek/budget-lens-offline/issues/85).
- UI: [#67](https://github.com/alimek/budget-lens-offline/issues/67).

## Open questions

- Charting library: [#44](https://github.com/alimek/budget-lens-offline/issues/44).
- Warning semantics & notifications: [#45](https://github.com/alimek/budget-lens-offline/issues/45).
- NBP caching & refresh: triggers and max age decided ([owner review #124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950)); [#46](https://github.com/alimek/budget-lens-offline/issues/46) covers the remaining edge cases
  (weekends/holidays, errors, fixtures).
