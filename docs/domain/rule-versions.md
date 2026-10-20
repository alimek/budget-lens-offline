# Rule versions ("from this month on")

Status: **implemented** in `packages/core/src/rule-versions.ts` (#80), per the
[#40 research](https://github.com/alimek/budget-lens-offline/issues/40) and its
[owner review](https://github.com/alimek/budget-lens-offline/issues/40#issuecomment-6263679627) (all defaults
Q1–Q8 accepted). Storage and the transaction that applies a plan belong to `packages/db` (#74) and the items
repository (#81).

## Model

An item keeps one stable identity (`id`, `itemType`, and item-level fields such as name, note and currency) and a
list of **rule versions** (Q1: versions under one item, not split items):

```ts
VersionedItem = { id, itemType, versions: RuleVersion[] }
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
  `VersionedItem` carries no currency yet: per-item currency in the core item model is #138, and any extra
  item-level field (such as a required `currency`) is passed through to the item in force.
- Item-level fields are not versioned: a rename shows the new name in history too. `itemType` is fixed.

## Resolving occurrences

- `validateRuleVersions(versions)` – error codes for versions loaded from storage (never throws): `invalid-versions`
  (not an array, or an entry is not an object), `no-versions`, `invalid-effective-from`, `duplicate-effective-from`,
  `invalid-amount` (not whole minor units ≥ 0), `invalid-schedule` (see `validateSchedule`).
- `versionInForce(versions, month)` and `itemInForce(item, month)`: the item as a `ScheduledItem` with the amount and
  schedule of the version in force (`undefined` before the first version). Extra fields of the item are kept, so an
  item with a `currency` is a `ClosingItem` for `closeMonth` in that month.
- `resolveVersionedOccurrences(items, overrides, month)` – the version in force of each item, then
  `resolveOccurrences` ([occurrence overrides](occurrence-overrides.md), #5). Overrides stay keyed by
  `(itemType, itemId, month)` and are independent of versions. Items with invalid versions are reported in
  `invalidItems`.

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

The plan (`RuleEditPlan`):

- `upsertVersions` and `deleteVersions` (by `effectiveFrom`); `upsertOverrides` (only for `only-month`).
- `orphanedOverrides` – overrides of open months that applied before the edit and that the new rule no longer
  schedules. The UI lists them; after confirmation they are deleted in the same transaction (Q4).
- `keptOverrides` – overrides that still apply in months whose scheduled amount or day changes: they keep their own
  amount or skip (Q5). `resetKeptOverrides: true` on the edit ("reset these months") moves them to `resetOverrides`,
  which are deleted.
- `notices`: `scheduled-change-kept` (a later scheduled version stays in force from `month`; the UI offers to replace
  it with `replaceScheduled: true`, Q2), `scheduled-change-replaced` (a later version is deleted on request) and
  `no-versions-left` (the edit deletes every version, so the repository can delete or archive the item).

`applyRuleEditPlan(state, plan)` returns the state after the plan is applied, as the repository writes it (for checks
and live state).

`defaultEditScope(item, activeMonth)` is the scope the item form selects first: `from-month` when the item has an
occurrence in a closed month, otherwise `fix-everywhere` (Q8).

### The closed-month invariant

Every month before the active month counts as closed: months close in sequence and no item starts before the active
month. **An edit is accepted only if it changes the resolved occurrences of no closed month**, including whether an
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

- The forecast (#6) still takes items with a single amount and schedule; projecting scheduled versions month by
  month belongs to the forecast data hook (#88), which can use `itemInForce` per month.
- Per-item currency in the core item model is #138.

## Legacy behaviour

"From this month on" changed the item amount globally, including history ([occurrence
overrides](occurrence-overrides.md#legacy-behaviour)). Legacy data is not imported, so there is no migration to
versions.
