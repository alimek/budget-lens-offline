# Transaction row swipe verification (#195)

Captured on 2026-10-20 with TesterArmy e2e 0.21.2 on the dedicated Android emulator (`E2E_ANDROID_AVD`) and iOS
simulator (`E2E_IOS_SIMULATOR`), using development builds and Metro freshly started with `--clear` on port 8073.
Telemetry was disabled. Every run below records `vcs.dirty: false`; the evidence commit only adds these artifacts.

| Run | App commit | Result | Run ID |
| --- | --- | --- | --- |
| Android baseline, deletion test | `311ac62` | 1 passed | `01a15aa8-3f97-7caa-8dd4-87200557efde` |
| Android focused list suite | `e864eab` | 4 passed | `01a15aaa-234e-7600-88d6-0a06513f3a3b` |
| Full Android suite | `364aa05` | 23 passed, 4 skipped | `01a15ab8-f008-795c-8299-cba8bdc69ae0` |
| Full iOS suite | `364aa05` | 23 passed, 4 skipped | `01a15ab2-37bf-7265-955d-8a25db3d60fe` |
| Android 200% text | `364aa05` | 4 passed | `01a15abd-2203-753e-b73c-b979e4048cd5` |
| iOS 200% text | `364aa05` | 1 passed, 3 failed (Settings scrolling) | `01a15abe-2930-7128-957f-2fb7b915fe9d` |

The baseline functional test passed while its screenshot reproduced the stuck grey press indication. The final
full suites include all four `design-system-list.e2e.ts` tests; the four large-text tests are opt-in and run
separately. Android checks the exact checkbox name, both action names before swiping, unchanged unpaid/paid state
after swiping, paid toggling, deletion and editing. The iOS implementation is unchanged.

- [Android before](android-before-list-swipe.png): sampled open-row RGB `(224, 224, 229)`, page `(242, 242, 247)`.
- [Android after](android-list-swipe.png): sampled open-row and page RGB both `(242, 242, 247)`; no persistent highlight.
- [iOS swipe](ios-list-swipe.png): native trailing actions remain unchanged.
- [Raw traces and screenshots](traces/): full-suite list tests, baseline and 200% list checks. The three failed
  iOS large-text showcase traces are retained too. Videos remain in the ignored runner output.

All PNGs and `trace.md` files are raw runner artifacts, copied without edits. The three swiped-row PNGs were
verified byte-identical to their source artifacts. Android screenshots use the demo clock 9:41.

Additional verification limitation: the iOS 200% list test passes, but the three showcase tests fail in
`openShowcase` while scrolling Settings to its showcase button, before reaching the showcase. This path is outside
the Android row change. Both system text sizes were restored after verification; the Metro process was stopped.

Commands from the repository root (device identifiers supplied locally):

```sh
pnpm --filter @budget-lens/mobile start --clear
adb -s <emulator-serial> reverse tcp:8073 tcp:8073
export E2E_TELEMETRY_DISABLED=1
export AGENT_DEVICE_STATE_DIR="$PWD/apps/mobile/.e2e/agent-device"
pnpm --filter @budget-lens/mobile exec e2e run --target android --output .e2e/195-list e2e/design-system-list.e2e.ts
E2E_IOS_SIMULATOR=<simulator> pnpm e2e:ios
pnpm e2e:android
adb -s <emulator-serial> shell settings put system font_scale 2.0
E2E_LARGE_TEXT=1 pnpm --filter @budget-lens/mobile exec e2e run --target android --output .e2e/android-large-text e2e/large-text.e2e.ts
adb -s <emulator-serial> shell settings put system font_scale 1.0
xcrun simctl ui <simulator> content_size accessibility-extra-large
E2E_LARGE_TEXT=1 E2E_IOS_SIMULATOR=<simulator> pnpm --filter @budget-lens/mobile exec e2e run --target ios --output .e2e/ios-large-text e2e/large-text.e2e.ts
xcrun simctl ui <simulator> content_size large
pnpm check
pnpm audit --audit-level high
pnpm check:licenses
```

The worktree-local device daemon avoids attaching the runner to another checkout's daemon. No model steps or
credentials were used.
