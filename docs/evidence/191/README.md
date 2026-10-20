# Settings privacy disclosure verification (#191)

Captured on 2026-10-20 from the Expo SDK 58 development builds using TesterArmy e2e 0.21.2 with
`@e2e-dev/mobile` 0.12.3, Metro on the fixed port 8073 and `E2E_TELEMETRY_DISABLED=1`. Only the dedicated
simulator and emulator were used (status bar clock 9:41). No agent steps, model provider or credentials. App code at
`8ebafdb` (after review round 1; both reports `dirty: false`, the following commit only adds this evidence).

| Run | Device | Result | Run ID |
| --- | --- | --- | --- |
| `pnpm e2e:ios` | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 18 passed, 3 skipped (large text) | `01a15a95-31ac-795d-bc0f-7a760536f326` |
| `pnpm e2e:android` | dedicated Android emulator (`E2E_ANDROID_AVD`) | 18 passed, 3 skipped (large text) | `01a15a99-0009-75e9-95f4-8a9b4e54e6e7` |

The new test `e2e/privacy.e2e.ts` opens Settings and selects the *Privacy* text by its test ID
(`settings-privacy-updates`) and asserts that the element has the full English `privacy.updates` text (`toHaveText`). The screenshots are its unmodified `app.screenshot()` output; the
[traces](traces/) are its per-test `trace.md` files.

| Screenshot | iOS | Android |
| --- | --- | --- |
| Settings with the *Privacy* card (update check on every start, installation ID and backup restore, technical details, crash message, IP address) | [ios](ios-settings-privacy.png) | [android](android-settings-privacy.png) |
