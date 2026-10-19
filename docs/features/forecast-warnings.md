# PRD: Forecast, warnings & dashboard (E6)

Epic: [#28](https://github.com/alimek/budget-lens-offline/issues/28) · Status: approved · MVP

## Problem

People want to know months ahead whether their balance will drop too low, including the effect of bills in other
currencies.

## Goal

A forecast over a configurable horizon (default from `Settings`) of the rolling balance and total funds, **in the base
currency**. Foreign-currency items are converted at the latest cached NBP rate (or a newer manual rate), and the UI
shows which rates were used. Warnings (negative, low balance, large expense) use `Settings` thresholds. A home
dashboard summarizes it.

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
  when offline for long.
- As a user, I open the app and see my balance, the next warning and a mini forecast.

## Acceptance criteria (high level)

- The forecast is a pure, deterministic core function; all amounts in the output are in the base currency.
- Conversion uses the #124 strategy (one rounding, half away from zero). A missing rate gives a translatable
  warning, never a silent 0.
- Closed months use snapshotted rates; only open and future months use current rates.

## Success criteria

- The forecast for a 30-item, 3-currency budget computes in under 50 ms on device.
- Warnings match the thresholds in characterization and unit tests.

## Dependencies

- Core: [#6](https://github.com/alimek/budget-lens-offline/issues/6), [#140](https://github.com/alimek/budget-lens-offline/issues/140), [#8](https://github.com/alimek/budget-lens-offline/issues/8), [#124](https://github.com/alimek/budget-lens-offline/issues/124).
- Rates storage and refresh (E7, now an MVP prerequisite): [#92](https://github.com/alimek/budget-lens-offline/issues/92), [#93](https://github.com/alimek/budget-lens-offline/issues/93).
- DB: [#85](https://github.com/alimek/budget-lens-offline/issues/85).
- UI: [#67](https://github.com/alimek/budget-lens-offline/issues/67).

## Open questions

- Charting library: [#44](https://github.com/alimek/budget-lens-offline/issues/44).
- Warning semantics & notifications: [#45](https://github.com/alimek/budget-lens-offline/issues/45).
- NBP caching & refresh policy: [#46](https://github.com/alimek/budget-lens-offline/issues/46).
