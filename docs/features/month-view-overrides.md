# PRD: Month view, payment status & overrides (E4)

Epic: [#26](https://github.com/alimek/budget-lens-offline/issues/26) · Status: approved · MVP

## Problem

Each month people need to see what's due, tick off what's paid or received, and adjust a single month without
breaking the recurring rule.

## Goal

One screen for the active month lists every resolved occurrence, with its original currency and the base-currency
equivalent. Users mark occurrences paid or received, change the amount for one month, or skip it. Totals are in the
base currency.

## Scope

**In:**
- Occurrence overrides ([#5](https://github.com/alimek/budget-lens-offline/issues/5), done).
- Payment status and override tables ([#83](https://github.com/alimek/budget-lens-offline/issues/83)).
- Month screen ([#113](https://github.com/alimek/budget-lens-offline/issues/113)).
- Occurrence detail sheet ([#114](https://github.com/alimek/budget-lens-offline/issues/114)).

**Out:**
- Receipt scanning or attachments.
- Shared editing (no shared wallet).

## User stories

- As a user, I see planned, paid and remaining totals for this month.
- As a user, I mark my rent as paid.
- As a user, I change this month's electricity bill without changing the rule.
- As a user, I skip one month of a subscription.
- As a user, I see a USD subscription as "$12.99 ≈ 50,43 zł" with the rate date.

## Acceptance criteria (high level)

- Overrides are keyed by item and month (never by name) and are stored in the item's currency.
- Totals equal the sum of resolved occurrences converted to the base currency, each row rounded before summing.
- Past (closed) months are read-only and show snapshotted rates.

## Success criteria

- The month screen renders a 100-occurrence month without visible lag on a mid-range Android device.

## Dependencies

- Core: [#5](https://github.com/alimek/budget-lens-offline/issues/5), [#138](https://github.com/alimek/budget-lens-offline/issues/138); conversion [#140](https://github.com/alimek/budget-lens-offline/issues/140).
- DB: [#83](https://github.com/alimek/budget-lens-offline/issues/83).
- UI: [#65](https://github.com/alimek/budget-lens-offline/issues/65), [#64](https://github.com/alimek/budget-lens-offline/issues/64).
- E3 items: [#81](https://github.com/alimek/budget-lens-offline/issues/81).

## Open questions

- Month list performance: [#42](https://github.com/alimek/budget-lens-offline/issues/42).
