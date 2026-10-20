# Issue 200: large-text showcase scrolling

`openShowcase` now scrolls the Settings screen directly, then makes one additional bounded scroll to clear the
floating tab bar before tapping the final control. Assertions and timeouts are unchanged.

## Final verification

All three runs used commit `2e5c3aa3688b207456998fb57a12b34b746d351a`, with `run.vcs.dirty: false`, telemetry disabled, and a fresh
Metro from this worktree on port 8073. Final HEAD differs from this commit only under `docs/evidence/200`.
The runs were sequential on the dedicated iOS simulator BudgetLens-CI and Android emulator BudgetLens-Android.
iOS AX2 is `accessibility-extra-large` (about 200%); normal text size was restored before the full suites.
Android screenshots use the 9:41 demo clock.

| Run | Run ID | Result |
| --- | --- | --- |
| AX2 | `01a15b17-fe2b-73d8-963e-fa2d8ee6bd11` | 4 passed, 0 skipped, 0 failed, 0 flaky |
| iOS | `01a15b1a-d531-7194-a4c8-6215244e4b73` | 23 passed, 4 skipped, 0 failed, 0 flaky |
| Android | `01a15b20-dbd1-717a-9167-bde14923ccb9` | 24 passed, 4 skipped, 0 failed, 0 flaky |

Commands from the repository root, after adding the pnpm 12.14 shim to PATH:

```sh
E2E_TELEMETRY_DISABLED=1 E2E_IOS_SIMULATOR=BudgetLens-CI E2E_LARGE_TEXT=1 pnpm --filter @budget-lens/mobile exec e2e run --target ios --output .e2e/ios-large-text-verified e2e/large-text.e2e.ts
E2E_TELEMETRY_DISABLED=1 E2E_IOS_SIMULATOR=BudgetLens-CI pnpm e2e:ios
E2E_TELEMETRY_DISABLED=1 E2E_ANDROID_AVD=BudgetLens-Android pnpm e2e:android
pnpm check
```

`pnpm check` passed. The four skipped tests in each normal-text suite are the opt-in large-text tests, separately
proven on iOS above. The Android-only pressed-row regression is excluded from the iOS target by its platform filter.

## Raw screenshots

- [Original Settings scroll failure](ios-before-settings-scroll.png): run `01a15b00-10ab-7bc5-b79a-c8b8562d9340`,
  commit `e90ead74521a14a6d1ed1c554e0d6b11d94899c9`, clean tree; viewport scroll reported “scroll down moved nothing”.
- [Button covered by the tab bar](ios-before-covered-button.png): run `01a15b15-bba4-7645-9aeb-360629ba1432`,
  commit `9c240319186681f5a0e1821e80ff96b35b42ec65`, clean tree; targeting Settings alone could stop too early.
- [iOS large-text screenshots](ios-large-text/): components, controls, list, and successive whole-showcase pages.
- Full-suite screenshots: [iOS showcase](ios-showcase.png), [Android showcase](android-showcase.png),
  [iOS Settings](ios-settings.png), [Android Settings](android-settings.png).

All PNGs are copied byte-for-byte from e2e artifacts, without cropping, compositing, or other modification.
An intermediate AX2 run alongside Android exhausted the existing gesture budget near the color swatches;
final verification ran sequentially without changing any timeout.
