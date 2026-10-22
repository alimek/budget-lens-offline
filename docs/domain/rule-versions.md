# Rule versions ("from this month on")

Status: **implemented** in `packages/core/src/rule-versions.ts` (#80), per the
[#40 research](https://github.com/alimek/budget-lens-offline/issues/40) and its
[owner review](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627) (all defaults
Q1–Q8 accepted). Storage, the list reads and the transaction that writes a plan's versions are the items repository
in `packages/db` (#81, see its
[README](../../packages/db/README.md#items-and-rule-version-repository-srcitems-repositoryts-81)).

## Model

An item keeps one stable identity (`id`, `itemType`, and item-level fields such as name, note and currency) and a
list of **rule versions** (Q1: versions under one item, not split items):

```ts
VersionedItem = { id, itemType, currency: CurrencyCode, versions: RuleVersion[] }
RuleVersion   = { effectiveFrom: YearMonth, amount: MinorUnits, schedule: Schedule }
```

- At most one version per `effectiveFrom` month (unique `(item_id, effective_from)` in storage).
- The **version in force** in month *m* is the one with the greatest `effectiveFrom ≤ m`. Before the first version
  the item does not exist. A version covers `[effectiveFrom, next.effectiveFrom)`; inside that window its
  `Schedule` ([recurrence](recurrence.md), #4) decides the occurrence months, including `endMonth` and the
  day-of-month clamping (31 → 28/29 in February).
- The schedule's anchor may be earlier than `effectiveFrom`, which keeps the rhythm: "quarterly since February, a
  new amount from July" stays February/May/August/November.
- `amount` is integer minor units of the **item's** currency. The currency is fixed per item and is not part of a
  version; a different currency means a new item
  ([#81 owner decision](https://github.com/alimek/budget-lens-offline/issues/81#issuecomment-6276228839)).
  `VersionedItem` carries that required `currency` (#138, landed with #81) and so does the resolved item in force
  (`ScheduledItem.currency`), so a version's `amount` and the item in force always have one interpretation, and the
  occurrences resolved from it expose it. The repository rejects a later change of it
  (`immutable-field`), and a created item without an explicit currency takes the base currency of the
  `settings` singleton (#35 Q5 keeps a SQL default out of the column).
- Item-level fields are not versioned: a rename shows the new name in history too. `itemType` is fixed.

## Resolving occurrences

- `validateRuleVersions(versions)` – error codes for versions loaded from storage (never throws): `invalid-versions`
  (not an array, or an entry is not an object), `no-versions`, `invalid-effective-from`, `duplicate-effective-from`,
  `invalid-amount` (not whole minor units ≥ 0), `invalid-schedule` (see `validateSchedule`).
- `versionInForce(versions, month)` and `itemInForce(item, month)`: the item as a `ScheduledItem` with the amount and
  schedule of the version in force (`undefined` before the first version). Extra fields of the item are kept, so an
  item is a `ClosingItem` for `closeMonth` in that month, with its own currency.
- `resolveVersionedOccurrences(items, overrides, month)` – the version in force of each item, then
  `resolveOccurrences` ([occurrence overrides](occurrence-overrides.md), #5). Overrides stay keyed by
  `(itemType, itemId, month)` and are independent of versions. Items with invalid versions are reported in
  `invalidItems`.
  An item whose stored `currency` is outside the supported set (`isCurrencyCode`) is reported there too: every
  version amount is in a currency core does not know, so the item is never resolved (#138).

## Forecast integration

`forecast()` (#201) accepts versioned items with a required item-level currency and resolves each forecast month
with `resolveVersionedOccurrences`. Overrides apply after selecting that month's version. Before the first version
there is no occurrence; scheduled changes affect only their own month and later months. Single-rule inputs remain
supported with unchanged results. Invalid versions fail the forecast with `invalid-item` and the item id, without
partial totals; the data hook (#88) can filter and report invalid stored items before calling it.

The caller supplies the active month. Forecast never recalculates stored closed-month snapshots; historical charts
continue to use those snapshots. See [forecast](forecast.md) for payment filtering, currency conversion and tests.

## Edit scopes and the planner

`planRuleEdit(state, edit, { activeMonth })` is pure: it returns what the database writes in one transaction, or a
rejection code. The active month comes from the months table (status `active`), never from the clock, so a time-zone
change cannot move it.

| Scope (`edit.kind`) | Effect |
| --- | --- |
| `create` | A new item with its first version. `effectiveFrom` must be the active month or later (Q7). |
| `only-month` | "Only this month": an override upsert (#5), validated with `validateOverride` against the item in force. Never a version. |
| `change-from` | "From month M on": a version at M, which must be the active month or later. It copies the version in force at M and applies the patch; editing the same month again replaces that version. |
| `stop-from` | No occurrences from M on: `endMonth = M − 1` on the version in force, versions from M deleted. A version that has no occurrence left in its window is deleted and the version before it is ended instead. |
| `edit-scheduled` / `cancel-scheduled` | Change or delete a version whose `effectiveFrom` is after the active month. |
| `fix-everywhere` | Change the version in force in the active month (or the first version of an item that starts later) in place. Only while no closed month has an occurrence of that version (Q6). |

Two `change-from` edge cases:

- Before the item's first version, with a full patch (amount and schedule), it adds an earlier first version, so
  the item starts earlier. This is allowed while that month is open; a later first version stays as a
  `scheduled-change-kept` notice.
- On a version that has already ended (`endMonth` before M), a patch without a schedule copies that end month, so
  the new version has no occurrence. There is no notice; to restart the item, the patch needs a schedule.

The plan (`RuleEditPlan`):

- `upsertVersions` and `deleteVersions` (by `effectiveFrom`); `upsertOverrides` (only for `only-month`).
- `orphanedOverrides` – overrides of open months that applied before the edit and that the new rule no longer
  schedules. The UI lists them; after confirmation they are deleted in the same transaction (Q4).
- `keptOverrides` – overrides that still apply in months whose scheduled amount or day changes: they keep their own
  amount or skip (Q5). `resetKeptOverrides: true` on the edit ("reset these months") moves them to `resetOverrides`,
  which are deleted.
- `notices`: `scheduled-change-kept` (a later scheduled version stays in force from `month`; the UI offers to replace
  it with `replaceScheduled: true`, Q2), `scheduled-change-replaced` (a later version is deleted on request) and
  `no-versions-left` (the edit deletes every version: #81 archives the item in the same transaction as the last
  delete, never hard-deletes it, and an archived item is not checked for having versions, since its rule is history
  and never reaches the forecast).

`applyRuleEditPlan(state, plan)` returns the state after the plan is applied, as the repository writes it (for checks
and live state).

> **Superseded for the item form (2026-10-20, [decision on #80](https://github.com/alimek/budget-lens-offline/issues/80#issuecomment-6299720151)):** #40 Q8 no longer sets the form's default.
> On save, the item form's "Applies from" month picker (active month by default, or
> the item's first month if it starts later) runs `change-from`. The form uses `fix-everywhere` only for one-time
> items edited in place (and, optionally, where the result equals `change-from`).

### The closed-month invariant

Closed months are the months before the active month: `closeMonth` keeps exactly one active month, strictly after
every closed month, and closes months one by one without skipping ([month closing](month-closing.md)). Months before
the budget's first month hold no items, because new items start no earlier than the active month (Q7). **An edit is accepted only if it changes the resolved occurrences of no closed month**, including whether an
override there still applies (a skipped closed month must not lose or gain its occurrence behind the skip). The
check compares the item before and after the edit for every closed month from its first version on. Together with the
`closed_occurrences` snapshot written at close (Q3, [month closing](month-closing.md), #85), past months never change
after an edit.

### Rejection codes

| Code | When |
| --- | --- |
| `invalid-month` | `activeMonth` or the edit month is not `YYYY-MM`. |
| `invalid-item` | The stored versions are invalid (`errors` from `validateRuleVersions`). |
| `invalid-rule` | The versions after the edit are invalid, e.g. an amount that is not whole minor units (`errors`). |
| `invalid-override` | The `only-month` override is invalid for the item in force (`errors` from `validateOverride`). |
| `item-exists` | `create` for an item that already has versions. |
| `one-time-item` | `change-from` where the version in force is one-time: edit it with `fix-everywhere` while its month is open. |
| `month-closed` | The edit starts in, or the override is for, a month before the active month (`month`). |
| `closed-month-changed` | The edit would change a closed month (`month`, the first one). |
| `version-used-by-closed-month` | `fix-everywhere` of a version with an occurrence in a closed month (`month`). |
| `no-version-in-force` | `change-from` before the item's first version without a full patch (amount and schedule). |
| `version-not-found` / `version-not-scheduled` | `edit-scheduled` / `cancel-scheduled` of a missing version, or of one that is already in force. |

## Not covered yet

- Loading versions from storage and passing them to the forecast belongs to the forecast data hook (#88).
- Occurrence overrides in storage belong to #83: `applyRuleVersionPlan` writes a plan's versions only.

## Legacy behaviour

"From this month on" changed the item amount globally, including history ([occurrence
overrides](occurrence-overrides.md#legacy-behaviour)). Legacy data is not imported, so there is no migration to
versions.
