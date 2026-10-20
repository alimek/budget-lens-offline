# #74 database bootstrap evidence

Both development clients were rebuilt from this worktree after adding expo-sqlite. Native builds passed for iOS
and Android. A fresh Metro server served port 8073; the device lock was held throughout builds and verification
and released afterwards. Targets were the dedicated simulator/emulator selected by `E2E_IOS_SIMULATOR` and
`E2E_ANDROID_AVD`.

Tested commit: `5bd7eec4a354d3c263a17c22a785f9afca30dadb`. Both reports record `run.vcs.dirty: false`.
The evidence-only commit adds this README and the raw, unmodified e2e screenshots; it changes no app code.

| Platform | Command (telemetry disabled) | Run ID | Result |
| --- | --- | --- | --- |
| iOS | `pnpm e2e:ios --output .e2e/ios-final` | `01a15b34-9112-75a3-b7df-864dbffe7425` | 23 passed, 4 skipped, 0 failed |
| Android | `pnpm e2e:android` | `01a15b29-530f-7210-8793-0eb9ded98452` | 24 passed, 4 skipped, 0 failed |

The four skipped tests require a separate 200% text-size run (`E2E_LARGE_TEXT=1`); the full default suite was
selected on each platform. Android has one additional platform-specific list test. Both suites include cold
launch to Overview and navigation through all tabs and Savings. The screenshots below come from the passing
`opens Overview as the home screen` tests. Android uses the 9:41 demo clock.

- [iOS Overview](ios-overview.png)
- [Android Overview](android-overview.png)

The initial concurrent iOS run (`01a15b29-36e3-7d77-8009-59c615d4c2f7`) had 19 passed, 4 failed and 4 skipped:
picker/calendar taps, sheet scrolling and opening the showcase. Its six launch/navigation checks passed.
The input and overlay files then passed unchanged in an isolated six-test rerun
(`01a15b31-d5dc-7bf2-bcbf-4a641136f5dc`), followed by the passing full iOS run above. No assertions were relaxed.

`pnpm check` passed: 388 core tests, 11 database tests and 60 mobile tests; migration checks, typecheck, lint
and Fallow passed. Production bundle exports and `expo install --check` also passed on both platforms.
Database tests cover empty migration, idempotence, preserved rows on upgrade and business-rule constraints.
SQLCipher key setup, encrypted pre-migration copies, cipher guard and recovery remain #75.
