# PRD: Balance & month closing (E5)

Epic: [#27](https://github.com/alimek/budget-lens-offline/issues/27) · Status: proposed (open: [#66 questions 1–3](#open-questions)) · decisions: [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6340452613), [#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002), [#40](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627), [#35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802), [#39](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263679210), [#124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950) · MVP

## Problem

People want to settle each month, check it against their real balance, and keep an accurate history that doesn't
change later.

## Goal

After a month has ended, users confirm what was paid or received, skip what didn't happen, and close it. The app
**calculates** the closing balance; it is never typed in. In one SQLite transaction the app stores the month's totals
(in the base currency), **snapshots the rate used for every foreign-currency occurrence**, and opens the next month
with opening = closing. Closed months never change.

## Scope

**In:**
- Month closing core ([#84](https://github.com/alimek/budget-lens-offline/issues/84), PR [#137](https://github.com/alimek/budget-lens-offline/pull/137)).
- Rate snapshot at close ([#141](https://github.com/alimek/budget-lens-offline/issues/141)).
- Months table + transactional close ([#85](https://github.com/alimek/budget-lens-offline/issues/85)).
- Check-balance sheet ([#86](https://github.com/alimek/budget-lens-offline/issues/86), pending #66 question 1, recommended: keep), close-month flow ([#115](https://github.com/alimek/budget-lens-offline/issues/115)), history ([#87](https://github.com/alimek/budget-lens-offline/issues/87)).
- Entry points: check balance (pending #66 question 1) and close month from the **Month** tab; history from the Month toolbar menu
  ([#36 tabs](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530)).
- Month close per the [#66 decisions](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6340452613) (decided on #66 (2026-10-22), [confirmed by owner](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6340848278);
  supersedes #43 decisions 1, 5 and 6):
  - **No closing before the month ends** (A). "Close month" is available from the 1st of the next month; before that
    the Month menu shows it disabled ("Available from …"). That day an in-app prompt on Month and Overview says the
    month can be closed, plus an opt-in local reminder at 09:00 (#45 rules: off by default, never asked in onboarding,
    best-effort, no amounts). A future active month can't occur.
  - **One open month, closed in order** (B): once the active month has ended, months after it show "Close <month>
    first" with ways out (close it, go to it, plan in Items). No "close all".
  - **Calculated closing balance** (C): opening + all of the month's income − all of its expenses, every effective
    occurrence counted, paid or not, after overrides and skips, converted per row. The same calculation is used for
    "Expected at month end", the close summary and the next month's opening. No `estimated` flag, no typed balance.
  - **Check balance** (#66 screen R8): the user can enter their actual balance as a **check only**. The sheet shows it, "Calculated
    now" (opening + received − paid so far) and the difference, and offers a one-time "Balance correction" item for
    the difference. The check is stored separately and never becomes the closing balance; the close summary shows the
    last check and its difference. Whether this sheet stays in the MVP is open (#66 question 1, recommended: keep);
    either way an entered balance never feeds the closing balance (C).
- Month lifecycle per the [#43 research](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6339987487) ([accepted 2026-10-22](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002)):
  - **Catch-up close** when the active month is before the device's calendar month: a "Close N months" banner on the
    Month tab and Overview leads to a guided close, oldest month first, no skipping, with "Month 1 of N" and **Later**.
    Each month shows its unpaid/unreceived items, and each closing balance is calculated (C).
  - **Unsettled items at close** don't block and still count in the closing balance as planned. Each can be marked
    paid/received, marked "Didn't happen" (a one-off skip), or **moved to the next month** (skipped here, added there
    as a one-time item or override).
  - **Month-end rates:** since a month closes only after it ends, the snapshot uses the NBP table A rate of the
    month's **last business day**, fetched when online; otherwise the current stored (or manual) rate. The
    snapshot records the rate's source and effective date ([#141](https://github.com/alimek/budget-lens-offline/issues/141)). This needs a dated NBP table A request in the
    rates client ([#8](https://github.com/alimek/budget-lens-offline/issues/8), #141).
  - **Corrections** to a closed month go into the active month: a one-off override in the month view
    ([#114](https://github.com/alimek/budget-lens-offline/issues/114)), or a change in the Items form from the active month on ("Applies from", [#80](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299720151),
    [#80, "Fix everywhere"](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299794108)). Items are archived, never deleted, and archiving keeps their closed months
    ([#63, decision 1](https://github.com/alimek/budget-lens-offline/issues/63#issuecomment-6335828342)).
  - The calendar month comes from the device's **local** date, never UTC; `packages/core` stays clock-free.
  - **Clock anomalies** warn, never block: a persisted `lastSeenMonth` high-water mark detects a device month that went
    backwards, and a close the device clock makes impossible shows "Your device date looks earlier than your last closed
    month".

**Out:**
- Automatic balances from banks.
- Re-denominating history (the base currency is locked).
- Reopening closed months. Post-MVP: only "Undo last close" while the next month is untouched (no balance check,
  overrides or statuses); older months are never reopened ([#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002)).
- Custom start-of-month / pay-cycle months: calendar months only; a custom start day is backlog.
- Importing rows into closed months (no import in the MVP; a later import must reject or re-date them).

## User stories

- As a user, after a month ends I confirm what was paid, skip what didn't happen, and close it; the app calculates the
  closing balance.
- As a user, I can check my real balance against the calculated one and add a one-time correction for the difference
  (pending #66 question 1, recommended: keep).
- As a user, before closing I confirm the items that are still unpaid or not received, and can move any of them to
  the next month.
- As a user who didn't open the app for months, I close the missed months one by one, oldest first.
- As a user, I look at a closed month a year later and see exactly the same totals and rates.

## Acceptance criteria (high level)

- The close is atomic: totals, rate snapshots and the next month are written together or not at all.
- December closes into January of the next year. Opening = previous closing.
- Closing is blocked with a clear message when a needed rate is missing; the user can enter a manual rate
  (`1 X = y PLN`).
- The snapshot records the rate used per occurrence in `closed_occurrences` ([owner review #40](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627), Q3): the NBP
  table A rate of the month's last business day when it can be fetched ([#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002), decision 3), otherwise the
  current stored NBP or newer manual rate, with its source and effective date. It is kept with the closed month, not
  in `exchange_rates`, which stores only the current rate per currency ([owner review #35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)). There is no
  savings snapshot at close ([owner review #39](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263679210)).
- A month can't be closed before it has ended on the device's local calendar; the close is rejected (core needs a
  `month < currentMonth` rule, e.g. a `month-not-ended` code), and months after an ended active month are blocked.
- Closing balance = opening + total income − total expenses (paid or not), so `netChange` = income − expenses. Core
  calculates it; a check balance never feeds it.
- Catch-up close: months close in sequence, oldest first (`month-sequence-conflict` otherwise), each with a calculated
  closing balance.
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

- Month lifecycle edge cases: decided on [#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002) (2026-10-22), except where #66 supersedes it (below).
- Month close: decided on [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6340452613) (2026-10-22), [confirmed by owner](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6340848278); supersedes #43 decisions
  1, 5 and 6 (early close, estimated catch-up balances, the closing balance source).
- Still open from [#66](https://github.com/alimek/budget-lens-offline/issues/66#issuecomment-6340452613) ("Questions for Grzegorz"; recommended defaults in brackets):
  1. Check balance: keep it check-only with "Add a one-time item for the difference" [keep], or remove manual
     balance entry from the MVP?
  2. Future months while the ended active month is unclosed: blocked (#66 screen R4) with browsing allowed before the month
     ends [recommended], or always blocked?
  3. "Remind me" card: after every close while reminders are off, or only after the first close [first only]?
- `closed_occurrences`: [#40](https://github.com/alimek/budget-lens-offline/issues/40) (decided: yes).
- Cross rates: [#124](https://github.com/alimek/budget-lens-offline/issues/124) (decided).
