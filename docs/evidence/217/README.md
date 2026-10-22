# Issue 217: recovery screens that stay safe and never blank

"Start over" now proves secure storage answers before it renames or moves anything, stores the key of the budget it
sets aside beside the file it belongs to, and drops the live key only after the rename (`startOverWithKeptKey` in
`packages/db/src/start-over.ts`). A retry or a start over keeps its boot screen on screen with disabled buttons, a
spinner after 300 ms and a status line, and every screen moved to the revised #60 copy, the "What you can do" list
and the full-width stacked actions, with `DestructiveButton` added for "Start over".

## Runs

Both suites ran sequentially on the dedicated iOS simulator BudgetLens-CI and Android emulator BudgetLens-Android at
commit `fca22380dbd75d7586d87cf08ac27166fdca1403` with `run.vcs.dirty: false`, telemetry disabled, and a fresh Metro
from this worktree on port 8073. The only later commit on this branch adds this evidence directory. Android
screenshots use the 9:41 demo clock. Each suite has 50 tests; four are the opt-in large-text tests, and the iOS
target also filters out one Android-only list test, which is why iOS reports 49 selected.

| Run | Run ID | Result |
| --- | --- | --- |
| iOS | `01a1655c-a924-7cff-840b-b1399e9770c7` | 45 passed, 4 skipped, 0 failed, 0 flaky |
| Android | `01a16567-0b87-7cce-a113-a821dde05cf5` | 46 passed, 4 skipped, 0 failed, 0 flaky |

Commands from the repository root, after adding the pnpm 12.14 shim to PATH:

```sh
E2E_TELEMETRY_DISABLED=1 E2E_IOS_SIMULATOR=BudgetLens-CI pnpm e2e:ios
E2E_TELEMETRY_DISABLED=1 E2E_ANDROID_AVD=BudgetLens-Android pnpm e2e:android
pnpm check
```

`pnpm check` passed (Biome, the development-route check, typecheck, 596 Vitest tests, Fallow).

## Raw screenshots

The six boot screens, in the reading order each one now uses (title, body, "What you can do", steps, status,
actions), from `e2e/encrypted-boot.e2e.ts` on `/dev/boot-screen` previews:
[recovery](ios-boot-screen-recovery.png) / [Android](android-boot-screen-recovery.png),
[migration failed](ios-boot-screen-migration-failed.png) /
[Android](android-boot-screen-migration-failed.png),
[restore failed](ios-boot-screen-restore-failed.png) / [Android](android-boot-screen-restore-failed.png),
[state unrecognized](ios-boot-screen-state-unrecognized.png) /
[Android](android-boot-screen-state-unrecognized.png),
[encryption unavailable](ios-boot-screen-encryption-unavailable.png) /
[Android](android-boot-screen-encryption-unavailable.png) — the one screen without "Start over", because it would
not help — and [secure storage](ios-boot-screen-storage-unreachable.png) /
[Android](android-boot-screen-storage-unreachable.png), which gained it (#217 R2).

"Start over" never runs directly; the native confirmation asks first:
[iOS](ios-storage-unreachable-start-over-alert.png), [Android](android-storage-unreachable-start-over-alert.png).

The pending and final states of #217 R4, with the screen itself still mounted and both actions disabled:
"Trying again…" [iOS](ios-boot-status-retrying.png) / [Android](android-boot-status-retrying.png),
"Setting up a new budget…" [iOS](ios-boot-status-starting-over.png) /
[Android](android-boot-status-starting-over.png), "That didn't work" [iOS](ios-boot-status-status-failed.png) /
[Android](android-boot-status-status-failed.png), and the blocked message of #217 R1
[iOS](ios-boot-status-start-over-blocked.png) / [Android](android-boot-status-start-over-blocked.png).

On a device, not a preview: a real encrypted database whose key this device has forgotten
([iOS](ios-recovery-unreadable-database.png), [Android](android-recovery-unreadable-database.png)) keeps its screen
visible through a retry and ends with the failed line
([iOS](ios-recovery-retry-failed.png), [Android](android-recovery-retry-failed.png)); after a real start over,
`/dev/storage-check` shows the budget still on the device as ciphertext, kept under its stamp, beside its new
database ([iOS](ios-storage-check-kept-file.png), [Android](android-storage-check-kept-file.png)).

All PNGs are copied byte-for-byte from the e2e artifacts of the runs above, without cropping, compositing or other
modification.
