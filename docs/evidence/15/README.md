# E2E smoke verification (#15)

Captured on 2026-10-20 from the Expo SDK 58 development builds using TesterArmy e2e 0.21.2 with
`@e2e-dev/mobile` 0.12.3, Metro on the fixed port 8073 and `E2E_TELEMETRY_DISABLED=1`. Only dedicated
simulators/emulators were used. No agent steps, model provider or credentials.

| Platform | Device | Result | Evidence |
| --- | --- | --- | --- |
| iOS | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 6/6 passed | [Overview](ios-overview.png), [Savings](ios-savings.png) |
| Android | dedicated Android emulator (`E2E_ANDROID_AVD`) | 6/6 passed | [Overview](android-overview.png), [Savings](android-savings.png), [Savings trace](android-savings-trace.md) |

The Savings screenshots are the `app.screenshot("savings")` output of the "opens Savings inside Overview" test,
taken after tapping `overview-open-savings` (on Android, the native button inside that test ID). The overview
screenshots are the `app.screenshot("overview")` output of the "opens Overview as the home screen" test. The Android
files and trace are unmodified output of e2e run `01a158e3-5647-7c6f-9393-815c4f62500d` (6/6 passed, commit
`f3519c8`; the test code is unchanged in the commit that adds them).

**Android status bar in e2e screenshots.** agent-device 0.21.28 stabilizes each Android screenshot: it allows System
UI demo mode, sends the demo `clock` command with `hhmm 0941`, hides notification icons, captures, then sends the
demo `exit` command. Stabilized Android screenshots therefore show **9:41** and no signal or notification icons, so
two captures of an unchanged screen can be identical; attach the test's `trace.md` (run ID and steps) as well.

On one emulator, captures with this sequence showed a fixed **10:42** instead (tested with `hhmm 0941` and `1111`) and
were byte-identical to an earlier run's file. Sending the demo `enter` command once and then `exit` fixed it; later
stabilized captures showed 9:41. If Android e2e screenshots show any clock other than 9:41, reset demo mode on the
dedicated emulator once:

```sh
adb -s <emulator-serial> shell am broadcast -a com.android.systemui.demo -e command enter
adb -s <emulator-serial> shell am broadcast -a com.android.systemui.demo -e command exit
```

Commands run from the repo root:

```sh
pnpm --filter @budget-lens/mobile start
adb -s <emulator-serial> reverse tcp:8073 tcp:8073
pnpm e2e:ios
pnpm e2e:android
pnpm check
```
