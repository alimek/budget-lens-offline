# E2E smoke verification (#15)

Captured on 2026-10-20 from the Expo SDK 58 development builds using TesterArmy e2e 0.21.2 with
`@e2e-dev/mobile` 0.12.3, Metro on the fixed port 8073 and `E2E_TELEMETRY_DISABLED=1`. Only dedicated
simulators/emulators were used. No agent steps, model provider or credentials.

| Platform | Device | Result | Evidence |
| --- | --- | --- | --- |
| iOS | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 6/6 passed | [Overview](ios-overview.png), [Savings](ios-savings.png) |
| Android | dedicated Android emulator (`E2E_ANDROID_AVD`) | 6/6 passed | [Savings](android-savings.png), [Savings trace](android-savings-trace.md) |

The Savings screenshots are the `app.screenshot("savings")` output of the "opens Savings inside Overview" test,
taken after tapping `overview-open-savings` (on Android, the native button inside that test ID). The iOS overview
screenshot is the `app.screenshot("overview")` output of the "opens Overview as the home screen" test.

**Android screenshots are byte-identical across runs of an unchanged screen.** agent-device stabilizes every
Android screenshot: it switches the System UI to demo mode (fixed status-bar clock, signal and notification icons
hidden), captures, then leaves demo mode. A fresh capture of the same Savings screen therefore has the same bytes as
[the #73 file](../73/android-savings.png). The proof that this run used the new tap path is the committed
[trace](android-savings-trace.md): its run ID and step 3,
`getByTestId("overview-open-savings") >> getByRole("button")`. iOS screenshots show the live clock, so they change
on every run.

Commands run from the repo root:

```sh
pnpm --filter @budget-lens/mobile start
adb -s <emulator-serial> reverse tcp:8073 tcp:8073
pnpm e2e:ios
pnpm e2e:android
pnpm check
```
