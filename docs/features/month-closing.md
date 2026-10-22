# PRD: Balance & month closing (E5)

Epic: [#27](https://github.com/alimek/budget-lens-offline/issues/27) · Status: proposed (open: [#43 vs #66 month-close conflict](#open-questions)) · decisions: [#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002), [#40](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627), [#35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802), [#39](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263679210), [#124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950) · MVP

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
- Month lifecycle per the [#43 research](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6339987487) ([accepted 2026-10-22](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002)):
  - **Catch-up close** when the active month is before the device's calendar month: a "Close N months" banner on the
    Month tab leads to a guided close, oldest month first, no skipping. Each month shows its unpaid/unreceived items.
    How each catch-up month's closing balance is set is an open question (see Open questions).
  - **Unsettled items at close** still don't block, but each can optionally be **moved to the next month** (a one-time
    item or override there); otherwise it drops, as before.
  - **Late-close rates:** when a month is closed after its calendar month ended, the snapshot uses the NBP table A rate
    of the month's **last business day**, fetched when online; otherwise the current stored (or manual) rate. The
    snapshot records the rate's source and effective date ([#141](https://github.com/alimek/budget-lens-offline/issues/141)). This needs a dated NBP table A request in the
    rates client ([#8](https://github.com/alimek/budget-lens-offline/issues/8), #141).
  - **Corrections** to a closed month go into the active month: a one-off override in the month view
    ([#114](https://github.com/alimek/budget-lens-offline/issues/114)), or a change in the Items form from the active month on ("Applies from", [#80](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299720151),
    [#80 PO](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299794108)). Items are archived, never deleted, and archiving keeps their closed months
    ([#63, decision 1](https://github.com/alimek/budget-lens-offline/issues/63#issuecomment-6335828342)).
  - The calendar month comes from the device's **local** date, never UTC; `packages/core` stays clock-free.
  - **Clock anomalies** warn, never block: a persisted `lastSeenMonth` high-water mark detects a device month that went
    backwards, and a close rejected with `future-month` shows "Your device date looks earlier than your last closed
    month".

**Out:**
- Automatic balances from banks.
- Re-denominating history (the base currency is locked).
- Reopening closed months. Post-MVP: only "Undo last close" while the next month is untouched (no balance update,
  overrides or statuses); older months are never reopened ([#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002)).
- Custom start-of-month / pay-cycle months: calendar months only; a custom start day is backlog.
- Importing rows into closed months (no import in the MVP; a later import must reject or re-date them).

## User stories

- As a user, I enter my real balance and close the month.
- As a user, before closing I confirm the items that are still unpaid or not received, and can move any of them to
  the next month.
- As a user who didn't open the app for months, I close the missed months one by one, oldest first.
- As a user, I look at a closed month a year later and see exactly the same totals and rates.

## Acceptance criteria (high level)

- The close is atomic: totals, rate snapshots and the next month are written together or not at all.
- December closes into January of the next year. Opening = previous closing.
- Closing is blocked with a clear message when a needed rate is missing; the user can enter a manual rate
  (`1 X = y PLN`).
- For a close within its calendar month, the snapshot records the current stored rate (NBP or a newer manual rate), per occurrence in
  `closed_occurrences` ([owner review #40](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627), Q3). It is kept with the closed month, not in `exchange_rates`, which stores only the
  current rate per currency ([owner review #35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)). There is no savings snapshot at close ([owner review #39](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263679210)).
  For a late close the snapshot uses the last-business-day NBP rate of the closed month when it can be fetched
  ([#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002), decision 3); the historical rate lives only in the snapshot, not in `exchange_rates`.
- Catch-up close: months close in sequence, oldest first (`month-sequence-conflict` otherwise).
- Closed months stay immutable. The month view only writes one-off overrides for open months, and "Applies from"
  offers only the active month or later; the planner still rejects anything that would change a closed month
  (`closed-month-changed`).
- The current month is derived from the device's local date; a backwards clock produces a warning, not a block.
- A crash or app kill mid-close leaves no partial state; a repeated close returns `no-active-month`.

## Success criteria

- No closed month changes after rate refreshes or app updates (regression test).

## Dependencies

- Core: [#84](https://github.com/alimek/budget-lens-offline/issues/84), [#141](https://github.com/alimek/budget-lens-offline/issues/141), [#8](https://github.com/alimek/budget-lens-offline/issues/8).
- DB: [#85](https://github.com/alimek/budget-lens-offline/issues/85), schema [#35](https://github.com/alimek/budget-lens-offline/issues/35).
- UI: [#66](https://github.com/alimek/budget-lens-offline/issues/66).
- E4: [#83](https://github.com/alimek/budget-lens-offline/issues/83), [#113](https://github.com/alimek/budget-lens-offline/issues/113).

## Open questions

- Month lifecycle edge cases: [#43](https://github.com/alimek/budget-lens-offline/issues/43): decided on [#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002) (2026-10-22), except the three points
  below.
- **Month close: [#43 acceptance](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002) vs [#66 decisions](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6340452613) (2026-10-22). Pending
  owner confirmation: Grzegorz must confirm which applies.** #66 says it supersedes #43 on:
  - Early close before month end: early close with a warning (#43 row 7, decision 6) vs. no close before month end
    (#66 A).
  - Catch-up closing balances: estimated balances with an `estimated` flag and a real balance typed only for the last
    month (#43 row 1, decision 1) vs. every closing balance calculated from the data, no flag, no typed balance (#66 C).
  - The closed month's closing balance: the user's actual balance (#43 row 5) vs. calculated (opening + all income −
    all expenses, paid or not), with an entered balance only as a check (#66 C).

  Until then, the Goal and the first user story keep their earlier wording ("set the actual balance"); the
  update-balance sheet ([#86](https://github.com/alimek/budget-lens-offline/issues/86)) also depends on this.
- `closed_occurrences`: [#40](https://github.com/alimek/budget-lens-offline/issues/40) (decided: yes).
- Cross rates: [#124](https://github.com/alimek/budget-lens-offline/issues/124) (decided).
