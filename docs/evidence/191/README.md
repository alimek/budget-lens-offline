# Settings privacy disclosure verification (#191)

Captured on 2026-10-20 from the Expo SDK 58 development builds using TesterArmy e2e 0.21.2 with
`@e2e-dev/mobile` 0.12.3, Metro on the fixed port 8073 and `E2E_TELEMETRY_DISABLED=1`. Only the dedicated
simulator and emulator were used (status bar clock 9:41). No agent steps, model provider or credentials. App code at
`ba73af2` (the following commit changes docs only).

| Run | Device | Result | Run ID |
| --- | --- | --- | --- |
| `pnpm e2e:ios` | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 18 passed, 3 skipped (large text) | `01a15a7b-09a8-75ca-8541-7caf2df8e582` |
| `pnpm e2e:android` | dedicated Android emulator (`E2E_ANDROID_AVD`) | 18 passed, 3 skipped (large text) | `01a15a7e-c431-7c74-8783-ad461b42db95` |

The new test `e2e/privacy.e2e.ts` opens Settings and checks that the *Privacy* card (`settings-privacy-updates`)
shows the full English `privacy.updates` text. The screenshots are its unmodified `app.screenshot()` output; the
[traces](traces/) are its per-test `trace.md` files.

| Screenshot | iOS | Android |
| --- | --- | --- |
| Settings with the *Privacy* card (EAS Update check, installation ID, technical details, crash message, IP address) | [ios](ios-settings-privacy.png) | [android](android-settings-privacy.png) |
