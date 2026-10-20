# PRD: Month view, payment status & overrides (E4)

Epic: [#26](https://github.com/alimek/budget-lens-offline/issues/26) · Status: proposed (open: [#42](https://github.com/alimek/budget-lens-offline/issues/42)) · decisions: [#80 edit flow](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299720151), [#35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802), [#124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950) · MVP

## Problem

Each month people need to see what's due, tick off what's paid or received, and adjust a single month without
breaking the recurring rule.

## Goal

One screen for the active month (the **Month** tab) lists every resolved occurrence, with its original currency and the base-currency
equivalent. Users mark occurrences paid or received, change the amount for one month, or skip it. Totals are in the
base currency. A change here is **always a one-off change for that month** (an override); the month view has no
"from this month on" choice. Future changes are made in the items screen ([E3](budget-items-recurrence.md), [owner decision #80](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299720151)).

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
- As a user with the app in Polish, I see a USD subscription as "12,99 USD ≈ 50,43 zł" with the rate date (the exact
  symbols and spacing come from native `Intl` and can differ by platform, ADR 0012).

## Acceptance criteria (high level)

- Overrides are keyed by `(item_id, month)` (never by name; one `items` table with `kind`) and are stored in the
  item's currency. Payment status is its own table ([owner review #35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)).
- Open months convert at the current stored rate; a stale badge appears when the effective date is older than the
  Settings threshold (2 business days by default, per the [#8 decision](https://github.com/alimek/budget-lens-offline/issues/8#issuecomment-6277037751))
  ([owner review #124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950)).
- Totals equal the sum of resolved occurrences converted to the base currency, each row rounded before summing.
- Past (closed) months are read-only and show snapshotted rates.
- The occurrence detail sheet saves amount changes only as overrides for that month. It never changes the item's rule
  versions and offers no scope choice.

## Success criteria

- Proposed target: the month screen renders a 100-occurrence month without visible lag on a mid-range Android device.

## Dependencies

- Core: [#5](https://github.com/alimek/budget-lens-offline/issues/5), [#138](https://github.com/alimek/budget-lens-offline/issues/138); conversion [#140](https://github.com/alimek/budget-lens-offline/issues/140).
- DB: [#83](https://github.com/alimek/budget-lens-offline/issues/83).
- UI: [#65](https://github.com/alimek/budget-lens-offline/issues/65). (The [#64](https://github.com/alimek/budget-lens-offline/issues/64) choice dialog moved to the items screen as the "Applies from" picker:
  [#82](https://github.com/alimek/budget-lens-offline/issues/82), [#63](https://github.com/alimek/budget-lens-offline/issues/63).)
- E3 items: [#81](https://github.com/alimek/budget-lens-offline/issues/81).

## Open questions

- Month list performance: [#42](https://github.com/alimek/budget-lens-offline/issues/42).
