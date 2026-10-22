# Issue 218: react-native-chart-kit spike and minimum OS versions

The development-only screen `budget-lens:///dev/chart-spike` draws a twelve-month forecast sample with
`react-native-chart-kit` 7.0.4 (`/v2`) on `react-native-svg` 15.16.0 and reports the tapped month with both amounts.
`react-native-chart-kit`, `react-native-svg` 15.16.0 and `expo-build-properties` 58.0.11 are new, and
`apps/mobile/app.json` now sets Android `minSdkVersion` 26 and the iOS deployment target 16.4, so the development
clients of both platforms were rebuilt from this branch before the runs (new architecture). Findings:
[ADR 0014](../../decisions/0014-chart-library-and-minimum-os.md) and
[#218](https://github.com/alimek/budget-lens-offline/issues/218).

## Runs

Both suites ran sequentially on the dedicated iOS simulator BudgetLens-CI and Android emulator BudgetLens-Android at
commit `734fb58679d76b0a154569c07bbb68840e91b79a` with `run.vcs.dirty: false`, telemetry disabled, and a fresh Metro
from this worktree on port 8073. Final HEAD differs from that commit only under `docs/`. The three
chart tests are `e2e/chart-spike.e2e.ts`: the chart box, the tapped last month with both amounts, and a second tap
that moves the readout to an earlier month. Android screenshots use the 9:41 demo clock.

| Run | Run ID | Result |
| --- | --- | --- |
| iOS | `01a1646f-eba4-7472-befe-5ca66464bed6` | 39 passed, 4 skipped, 0 failed, 0 flaky |
| Android | `01a16479-54f9-7c53-b345-b7ea37673a23` | 40 passed, 4 skipped, 0 failed, 0 flaky |

Commands from the repository root, after adding the pnpm 12.14 shim to PATH:

```sh
EXPO_NO_TELEMETRY=1 npx expo run:android --device <BudgetLens-emulator-serial> --port 8073
E2E_TELEMETRY_DISABLED=1 E2E_IOS_SIMULATOR=BudgetLens-CI pnpm e2e:ios
E2E_TELEMETRY_DISABLED=1 E2E_ANDROID_AVD=BudgetLens-Android pnpm e2e:android
pnpm check
```

`pnpm check` passed (Biome, the portability and development-route checks, typecheck, 577 Vitest tests, Fallow).
The four skipped tests in each suite are the opt-in large-text tests.

## Raw screenshots

- [iOS chart](ios-chart.png), [iOS after a tap on the last month](ios-chart-tapped.png)
- [Android chart](android-chart.png), [Android after a tap on the last month](android-chart-tapped.png)

All four PNGs are copied byte-for-byte from the e2e artifacts of the runs above, without cropping, compositing or
other modification. The y axis shows full amounts, and the last month reads −PLN 2 693,95 with PLN 3 306,05 in
total funds. Both reference-line labels land on each other, which is noted for #89.
