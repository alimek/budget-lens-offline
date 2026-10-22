# Issue 112: the items list

Screenshots from the TesterArmy `e2e` runs of `e2e/items-list.e2e.ts` on a local development build: the empty
state, the seeded list with its recurrence summaries, the scheduled-change badge and the foreign-currency note, the
archive confirmation, and the archived list. The runs used the dedicated iOS simulator `BudgetLens-CI` and the
dedicated Android emulator `BudgetLens-Android` (`emulator-5556`) only, with telemetry disabled, sequentially, and a
fresh Metro from this worktree on port 8073. Both runs used commit `574030c80dad7a95ea57e2d213b3c5a803e349b2` with
`run.vcs.dirty: false`; the Android captures use the 9:41 demo clock.

| Platform | Run ID | Result |
| --- | --- | --- |
| iOS | `01a1636d-9145-78bd-942c-541d95067a95` | 35 passed, 4 skipped, 0 failed |
| Android | `01a16367-9fed-7b9e-94a9-4eb29ae7966c` | 36 passed, 4 skipped, 0 failed |

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
| Archived items | `ios-items-archived.png` | `android-items-archived.png` |

All PNGs are copied byte-for-byte from the e2e artifacts, without cropping, compositing or other modification.

Found while testing: the Android navigation row wrapped its label one letter per line and logged a Compose interop
error, because the chevron was a React Native view inside a Compose slot and the host had no width to lay out
against; `574030c` takes the Compose icon in the slot directly and measures the host against the viewport.
