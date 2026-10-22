# Issue 112: the items list

Screenshots from the TesterArmy `e2e` runs of `e2e/items-list.e2e.ts` on a local development build: the empty
state, the seeded list with its recurrence summaries, the scheduled-change badge and the foreign-currency note, the
archive confirmation, the notice a finished archive leaves behind, and the archived list. The runs used the
dedicated iOS simulator `BudgetLens-CI` and the dedicated Android emulator `BudgetLens-Android` only, with
telemetry disabled, sequentially, and a fresh Metro from this worktree on port 8073. Both runs used commit
`88e87583871782b7f8e06d176abc96dbbfab7bf1` with `run.vcs.dirty: false`; the Android captures use the 9:41 demo
clock.

| Platform | Run ID | Result |
| --- | --- | --- |
| iOS | `01a163ee-57ca-71cf-9255-4c04014d7c68` | 36 passed, 4 skipped, 0 failed |
| Android | `01a163e5-8eac-769a-8d61-c24390b5cce5` | 37 passed, 4 skipped, 0 failed |

```sh
pnpm e2e:ios       # E2E_IOS_SIMULATOR=BudgetLens-CI
pnpm e2e:android   # E2E_ANDROID_AVD=BudgetLens-Android
```

The four skipped tests in each suite are the opt-in large-text tests (`E2E_LARGE_TEXT=1`).

## Screenshots

| State | iOS | Android |
| --- | --- | --- |
| Empty list | `ios-items-empty.png` | `android-items-empty.png` |
| Seeded list | `ios-items-list.png` | `android-items-list.png` |
| Seeded list, dark | `ios-items-list-dark.png` | `android-items-list-dark.png` |
| Archive confirmation | `ios-items-archive-dialog.png` | `android-items-archive-dialog.png` |
| Archive done: `Snackbar` on Android, announced on iOS | `ios-items-archived-notice.png` | `android-items-archived-notice.png` |
| Long-press menu of a row | `ios-items-row-menu.png` | `android-items-row-menu.png` |
| Archived items | `ios-items-archived.png` | `android-items-archived.png` |

The "Archived items" row counts what is behind it, and the count is part of its accessible name; the list and the
archived captures show it, and the notice capture shows it having grown by the row that was just archived.

All PNGs are copied byte-for-byte from the e2e artifacts, without cropping, compositing or other modification.

Found while testing: the Android navigation row wrapped its label one letter per line and logged a Compose interop
error, because the chevron was a React Native view inside a Compose slot and the host had no width to lay out
against; the Compose icon now sits in the slot directly and the host is measured against the viewport.
