# E2E smoke verification (#15)

Captured on 2026-10-20 from the Expo SDK 58 development builds using TesterArmy e2e 0.21.2 with
`@e2e-dev/mobile` 0.12.3, Metro on the fixed port 8073 and `E2E_TELEMETRY_DISABLED=1`. Only dedicated
simulators/emulators were used. No agent steps, model provider or credentials.

| Platform | Device | Result | Screenshot |
| --- | --- | --- | --- |
| iOS | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 6/6 passed | [Savings](ios-savings.png) |
| Android | dedicated Android emulator (`E2E_ANDROID_AVD`) | 6/6 passed | [Savings](android-savings.png) |

The screenshots are the `app.screenshot("savings")` output of the "opens Savings inside Overview" test,
taken after tapping `overview-open-savings` (on Android, the native button inside that test ID).

Commands run from the repo root:

```sh
pnpm --filter @budget-lens/mobile start
adb -s <emulator-serial> reverse tcp:8073 tcp:8073
pnpm e2e:ios
pnpm e2e:android
pnpm check
```
