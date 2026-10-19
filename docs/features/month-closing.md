# PRD: Balance & month closing (E5)

Epic: [#27](https://github.com/alimek/budget-lens-offline/issues/27) · Status: proposed (open: [#43](https://github.com/alimek/budget-lens-offline/issues/43)) · decisions: [#40](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627), [#35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802), [#39](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263679210), [#124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950) · MVP

## Problem

People want to confirm their real balance at the end of a month and keep an accurate history that doesn't change
later.

## Goal

Users set the actual balance and close the active month. In one SQLite transaction the app stores the month's totals
(in the base currency), **snapshots the rate used for every foreign-currency occurrence**, and opens the next month
with opening = closing. Closed months never change.

## Scope

**In:**
- Month closing core ([#84](https://github.com/alimek/budget-lens-offline/issues/84), PR [#137](https://github.com/alimek/budget-lens-offline/pull/137)).
- Rate snapshot at close ([#141](https://github.com/alimek/budget-lens-offline/issues/141)).
- Months table + transactional close ([#85](https://github.com/alimek/budget-lens-offline/issues/85)).
- Update-balance sheet ([#86](https://github.com/alimek/budget-lens-offline/issues/86)), close-month flow ([#115](https://github.com/alimek/budget-lens-offline/issues/115)), history ([#87](https://github.com/alimek/budget-lens-offline/issues/87)).
- Entry points: update balance and close month from the **Month** tab; history from the Month toolbar menu
  ([#36 tabs](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530)).

**Out:**
- Automatic balances from banks.
- Re-denominating history (the base currency is locked).

## User stories

- As a user, I enter my real balance and close the month.
- As a user, before closing I confirm the items that are still unpaid or not received.
- As a user, I look at a closed month a year later and see exactly the same totals and rates.

## Acceptance criteria (high level)

- The close is atomic: totals, rate snapshots and the next month are written together or not at all.
- December closes into January of the next year. Opening = previous closing.
- Closing is blocked with a clear message when a needed rate is missing; the user can enter a manual rate
  (`1 X = y PLN`).
- The snapshot records the current stored rate (NBP or a newer manual rate) at close time, per occurrence in
  `closed_occurrences` ([owner review #40](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627), Q3). It is kept with the closed month, not in `exchange_rates`, which stores only the
  current rate per currency ([owner review #35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)). There is no savings snapshot at close ([owner review #39](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263679210)).

## Success criteria

- No closed month changes after rate refreshes or app updates (regression test).

## Dependencies

- Core: [#84](https://github.com/alimek/budget-lens-offline/issues/84), [#141](https://github.com/alimek/budget-lens-offline/issues/141), [#8](https://github.com/alimek/budget-lens-offline/issues/8).
- DB: [#85](https://github.com/alimek/budget-lens-offline/issues/85), schema [#35](https://github.com/alimek/budget-lens-offline/issues/35).
- UI: [#66](https://github.com/alimek/budget-lens-offline/issues/66).
- E4: [#83](https://github.com/alimek/budget-lens-offline/issues/83), [#113](https://github.com/alimek/budget-lens-offline/issues/113).

## Open questions

- Month lifecycle edge cases: [#43](https://github.com/alimek/budget-lens-offline/issues/43).
- `closed_occurrences`: [#40](https://github.com/alimek/budget-lens-offline/issues/40) (decided: yes).
- Cross rates: [#124](https://github.com/alimek/budget-lens-offline/issues/124) (decided).
