# Transaction row swipe verification (#195)

## Review round 1

Captured on 2026-10-20 using TesterArmy e2e 0.21.2 and the dedicated Android emulator (`E2E_ANDROID_AVD`) and iOS
simulator (`E2E_IOS_SIMULATOR`). Every run below records `vcs.dirty: false`. Both full suites ran on the final code
and baseline commit `97d8aba`; the final head differs from it only in `docs/evidence`.

| Run | Commit | Result | Run ID |
| --- | --- | --- | --- |
| Pre-fix Android regression | `311ac62` | 1 failed (expected) | `01a15adb-1f57-77fd-8562-192c4af7f373` |
| Full Android suite and regression | `97d8aba` | 24 passed, 4 skipped | `01a15aed-a44c-7fad-b57e-dfd978a609b4` |
| Full iOS suite | `97d8aba` | 23 passed, 4 skipped | `01a15af2-5879-7516-bf31-f3ab2edcfd82` |

The new Android-only test, `keeps the open Android row background unchanged`, swipes Rent open and calls
`expect(rent).toHaveScreenshot("android-rent-open", { threshold: 0, maxDiffPixels: 0 })`. Its crop covers only the
visible row, excluding the clock, action buttons and surrounding screen. The [committed baseline](../../../apps/mobile/e2e/design-system-list.e2e.ts-snapshots/android-rent-open-android-darwin.png)
was generated on the fix, inspected and committed before the full suites; neither proof run updates snapshots.

For the negative proof, the same worktree was checked out at the actual pre-fix commit `311ac62`. Because that
commit predates the regression spec, an ignored harness replayed the screenshot test and committed baseline.
The regression test case is byte-identical to the final spec, and the expected PNG is byte-identical to the
committed baseline. The assertion fails on pixel differences: **112,248 pixels (99%)**, with matching image sizes.
The worktree was then returned to the implementation branch for the full suites.

- [Pre-fix actual row crop](round-1/android-red/attempt-1/screenshots/android-rent-open-actual.png),
  [expected crop](round-1/android-red/attempt-1/screenshots/android-rent-open-expected.png),
  [diff](round-1/android-red/attempt-1/screenshots/android-rent-open-diff.png), [failure trace](round-1/android-red/trace.md).
- Raw swiped-row screenshots: [Android before](android-before-list-swipe.png), [Android after](android-list-swipe.png),
  [iOS](ios-list-swipe.png). Android uses the 9:41 demo clock.
- [Current raw traces and screenshots](round-1/): five Android list tests, four iOS list tests and the negative proof.
  Every PNG and `trace.md` is copied without edits. The three full screenshots were verified byte-identical to
  their source run artifacts. Videos remain in ignored runner output.

The full runs cover all standard tests; four 200% text tests are opt-in. The Android-specific visual test is
excluded from iOS. The iOS alert helper now finds the title-labelled container containing its named confirm button,
so native snapshot container kinds and matching triggers behind the modal do not affect confirmation.

Commands used for the full suites, from the repository root:

```sh
pnpm --filter @budget-lens/mobile start --clear
adb -s <emulator-serial> reverse tcp:8073 tcp:8073
export E2E_TELEMETRY_DISABLED=1
export AGENT_DEVICE_STATE_DIR="$PWD/apps/mobile/.e2e/agent-device"
pnpm e2e:android
E2E_IOS_SIMULATOR=<simulator> pnpm e2e:ios
pnpm check
```

Metro was freshly started on port 8073 from this worktree; shared-device access was locked throughout verification.
The Metro process was stopped and the lock released afterwards. No model steps or credentials were used.

The optional TalkBack audio check with usage hints disabled was not performed. The previously reported iOS 200%
Settings/showcase scrolling failure was not changed or rerun in this round. Earlier verification artifacts remain
under [traces](traces/); the table and `round-1` artifacts above are the current acceptance evidence.
