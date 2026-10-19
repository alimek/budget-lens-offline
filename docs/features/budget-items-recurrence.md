# PRD: Budget items & recurrence (E3)

Epic: [#25](https://github.com/alimek/budget-lens-offline/issues/25) · Status: approved · MVP

## Problem

People want to enter regular and one-off expenses and incomes once and see them in the right months, including bills
paid in foreign currencies.

## Goal

Users add, edit and archive expenses and incomes, one-time or recurring ("every N months from an anchor month",
optional end, day of month), **each in its own currency**. Editing "from this month on" creates a new rule version
and never rewrites history.

## Scope

**In:**
- Recurrence engine ([#4](https://github.com/alimek/budget-lens-offline/issues/4), done).
- Per-item currency in core ([#138](https://github.com/alimek/budget-lens-offline/issues/138)).
- Rule versioning ([#80](https://github.com/alimek/budget-lens-offline/issues/80)).
- Items tables ([#81](https://github.com/alimek/budget-lens-offline/issues/81)).
- Items list ([#112](https://github.com/alimek/budget-lens-offline/issues/112)).
- Add/edit form with currency picker and recurrence picker ([#82](https://github.com/alimek/budget-lens-offline/issues/82)).

**Out:**
- Bank imports or transaction sync (they need servers or aggregators).
- Categories, unless [#41](https://github.com/alimek/budget-lens-offline/issues/41) recommends them.
- Conversion logic, which lives in [E6](forecast-warnings.md) and E7.

## User stories

- As a user, I add a monthly rent in PLN and a yearly subscription in USD.
- As a user, I set a quarterly bill that starts in February and ends next year.
- As a user, I change an amount from next month on without changing past months.
- As a user, I see the approximate base-currency value of a foreign-currency item and the rate date.

## Acceptance criteria (high level)

- Items are never active before their start or after their end. The recurrence preview text matches the engine.
- Every item has a required currency (PLN + NBP table A). Amounts use that currency's exponent.
- Rule edits from a month on keep past months unchanged ([owner review #40](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627), all defaults accepted):
  - A later scheduled change is kept, with a notice and a "replace" option.
  - Overrides that are no longer scheduled are listed and deleted in the same transaction after confirmation. Kept
    overrides stay, with a "reset these months" option.
  - "Fix everywhere" only when no closed month uses the version.
  - New items start no earlier than the active month.
  - The edit form defaults to "From this month on" when the item has closed history.
- The base-value hint uses the current stored rate (no rate history), fetched once a day on app open.

## Success criteria

- A user can enter a typical household budget (15–30 items) in under 10 minutes in usability tests.

## Dependencies

- Core: [#4](https://github.com/alimek/budget-lens-offline/issues/4) and [#5](https://github.com/alimek/budget-lens-offline/issues/5) (done), [#138](https://github.com/alimek/budget-lens-offline/issues/138), [#80](https://github.com/alimek/budget-lens-offline/issues/80).
- DB: [#81](https://github.com/alimek/budget-lens-offline/issues/81).
- UI: [#63](https://github.com/alimek/budget-lens-offline/issues/63), [#64](https://github.com/alimek/budget-lens-offline/issues/64), [#61](https://github.com/alimek/budget-lens-offline/issues/61).
- Rates for the base-value hint: [#8](https://github.com/alimek/budget-lens-offline/issues/8), [#92](https://github.com/alimek/budget-lens-offline/issues/92), [#93](https://github.com/alimek/budget-lens-offline/issues/93).

## Open questions

- Rule versioning model: [#40](https://github.com/alimek/budget-lens-offline/issues/40) (decided).
- Categories in MVP: [#41](https://github.com/alimek/budget-lens-offline/issues/41).
- Item currency after creation: fixed, like `kind` (archive and recreate to change it), per the accepted
  [#40](https://github.com/alimek/budget-lens-offline/issues/40) recommendation. See [#81](https://github.com/alimek/budget-lens-offline/issues/81).
