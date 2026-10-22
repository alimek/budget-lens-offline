# PRD: Budget items & recurrence (E3)

Epic: [#25](https://github.com/alimek/budget-lens-offline/issues/25) · Status: approved ([#40](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627), [#41](https://github.com/alimek/budget-lens-offline/issues/41#issuecomment-6263792895), [item currency](https://github.com/alimek/budget-lens-offline/issues/81#issuecomment-6276228839), [edit flow](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299720151), [no "Fix everywhere"](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299794108)) · MVP

## Problem

People want to enter regular and one-off expenses and incomes once and see them in the right months, including bills
paid in foreign currencies.

## Goal

Users add, edit and archive expenses and incomes, one-time or recurring ("every N months from an anchor month",
optional end, day of month), **each in its own currency**. Future changes are made only in the items screen: on
save, the user picks the month the change applies from (the active month or a later one), which creates a new rule
version and never rewrites history. Edits in the month view are always one-off overrides ([E4](month-view-overrides.md)).

## Scope

**In:**
- Recurrence engine ([#4](https://github.com/alimek/budget-lens-offline/issues/4), done).
- Per-item currency in core ([#138](https://github.com/alimek/budget-lens-offline/issues/138): a required
  `currency` on the item models (`ScheduledItem`, `VersionedItem`) and on every resolved occurrence, with money
  that core never adds across currencies; landed with
  [#81](https://github.com/alimek/budget-lens-offline/issues/81) for versioned items).
- Rule versioning ([#80](https://github.com/alimek/budget-lens-offline/issues/80), done in core: [rule versions](../domain/rule-versions.md)).
- Items tables and repository ([#81](https://github.com/alimek/budget-lens-offline/issues/81), done in
  [`packages/db`](../../packages/db/README.md#items-and-rule-version-repository-srcitems-repositoryts-81)).
- Items list on the **Items** tab ([#112](https://github.com/alimek/budget-lens-offline/issues/112)), grouped by kind (expenses / incomes).
- Add/edit form with currency picker, recurrence picker and an **"Applies from"** month picker on save ([#82](https://github.com/alimek/budget-lens-offline/issues/82)).

**Out:**
- Bank imports or transaction sync (they need servers or aggregators).
- Categories and tags: not in MVP, planned for **v1.1** ([owner decision #41](https://github.com/alimek/budget-lens-offline/issues/41#issuecomment-6263792895)). In MVP, items are grouped by
  kind (expense/income), and the item form has no category field.
- Conversion logic, which lives in [E6](forecast-warnings.md) and E7.

## User stories

- As a user, I add a monthly rent in PLN and a yearly subscription in USD.
- As a user, I set a quarterly bill that starts in February and ends next year.
- As a user, I edit an item on the Items tab and choose the month the change applies from (this month or later),
  without changing past months.
- As a user who typed a wrong amount, I fix it by saving the edit from the item's first open month; if a later change
  is scheduled, I'm told it is kept and can replace it.
- As a user, I see the approximate base-currency value of a foreign-currency item and the rate date.

## Acceptance criteria (high level)

- Items are never active before their start or after their end. The recurrence preview text matches the engine.
- Every item has a required currency (PLN + NBP table A). Amounts use that currency's exponent. The currency is
  fixed after creation; a different currency means a new item (owner-confirmed 2026-10-19, [#81](https://github.com/alimek/budget-lens-offline/issues/81#issuecomment-6276228839)).
- Rule edits from a month on keep past months unchanged ([owner review #40](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627), all defaults accepted):
  - A later scheduled change is kept, with a notice and a "replace" option.
  - Overrides that are no longer scheduled are listed and deleted in the same transaction after confirmation. Kept
    overrides stay, with a "reset these months" option.
  - Corrections use the same save flow: saving from the item's first open month gives the corrected value from that
    month on, **up to any later scheduled change**. Later scheduled changes are kept (`scheduled-change-kept`, #40 Q2),
    so a later change that only moved, for example, the payment day keeps its own copy of the old amount until the
    user replaces it with the notice's "replace" option. Closed months never change.
  - New items start no earlier than the active month.
  - The edit form has no scope dialog and no separate "Fix everywhere" action ([owner decision #80](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299720151),
    [decision on #80, 2026-10-20](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299794108)). On save, the **"Applies from"** picker defaults to the active month (or the item's first
    month if it starts later) and allows any later month. This replaces #40 Q8. One-time items have no picker and
    are edited in place while their month is open.
- The base-value hint uses the current stored rate (no rate history), fetched on app open when a newer NBP table may exist.

## Success criteria

- Proposed target: a user can enter a typical household budget (15–30 items) in under 10 minutes in usability tests.

## Dependencies

- Core: [#4](https://github.com/alimek/budget-lens-offline/issues/4), [#5](https://github.com/alimek/budget-lens-offline/issues/5) and [#80](https://github.com/alimek/budget-lens-offline/issues/80) (done), [#138](https://github.com/alimek/budget-lens-offline/issues/138).
- DB: [#81](https://github.com/alimek/budget-lens-offline/issues/81).
- UI: [#63](https://github.com/alimek/budget-lens-offline/issues/63), [#64](https://github.com/alimek/budget-lens-offline/issues/64), [#61](https://github.com/alimek/budget-lens-offline/issues/61).
- Rates for the base-value hint: [#8](https://github.com/alimek/budget-lens-offline/issues/8), [#92](https://github.com/alimek/budget-lens-offline/issues/92), [#93](https://github.com/alimek/budget-lens-offline/issues/93).

## Open questions

- Rule versioning model: [#40](https://github.com/alimek/budget-lens-offline/issues/40) (decided). Edit flow: decided 2026-10-20 ([owner decision](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299720151), [decision on #80](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299794108)).
- Categories in MVP: [#41](https://github.com/alimek/budget-lens-offline/issues/41) (decided: no, v1.1).
- Item currency after creation: fixed, like `kind` (decided: owner-confirmed 2026-10-19, [#81](https://github.com/alimek/budget-lens-offline/issues/81#issuecomment-6276228839)); a different
  currency means a new item.
