# Design system slice 3 verification (#187)

Captured on 2026-10-20 from the Expo SDK 58 development builds (rebuilt for `react-native-gesture-handler` 3.3.0 and
Reanimated 4) using TesterArmy e2e 0.21.2 with `@e2e-dev/mobile`, Metro freshly started with `--clear` on the fixed
port 8073 and `E2E_TELEMETRY_DISABLED=1`. Only the dedicated simulator and emulator were used. No agent steps, model
provider or credentials. All four runs are on `d879388` with a clean tree (`vcs.dirty: false` in each run report); the
commit after it only adds this evidence.

| Run | Device | Result | Duration | Run ID |
| --- | --- | --- | --- | --- |
| `pnpm e2e:ios` | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 22 passed, 4 skipped (large text) | 380.2 s | `01a15a83-1563-7d9f-9b7f-3444075e9392` |
| `pnpm e2e:android` | dedicated Android emulator (`E2E_ANDROID_AVD`) | 22 passed, 4 skipped (large text) | 245.7 s | `01a15a89-0509-7b87-ba1d-1351665f42eb` |
| `large-text.e2e.ts`, iOS at AX2 (`accessibility-extra-large`, about 200%) | same simulator | 4/4 passed | 110.2 s | `01a15a8c-ce94-739f-addd-918c837fd60e` |
| `large-text.e2e.ts`, Android at font scale 2.0 | same emulator | 4/4 passed | 58.2 s | `01a15a8e-9929-7ed3-99da-00a94114bc4d` |

The full runs cover `design-system-inputs.e2e.ts` (3), `design-system-list.e2e.ts` (4), `design-system-overlays.e2e.ts`
(3), `design-system.e2e.ts` (6) and `scaffold.e2e.ts` (6). Every image here is an unmodified `app.screenshot()` file of
those runs (byte-identical; no montages or edits). The [traces](traces/) are the per-test `trace.md` files of the new
tests.

| Screenshot | iOS | Android |
| --- | --- | --- |
| `AppSheet` from "Show details" | [ios](ios-sheet.png) | [android](android-sheet.png) |
| `AppAlert` from "Close month" | [ios](ios-alert.png) | [android](android-alert.png) |
| `AppContextMenu` "More actions" | [ios](ios-menu.png) | [android](android-menu.png) |
| List example: "Rent" swiped open (Edit, Delete) | [ios](ios-list-swipe.png) | [android](android-list-swipe.png) |
| List example: "Edit" swipe action opens the sheet | [ios](ios-list-edit-sheet.png) | [android](android-list-edit-sheet.png) |
| Whole showcase, light | [1](ios-showcase-light-1.png) [2](ios-showcase-light-2.png) [3](ios-showcase-light-3.png) [4](ios-showcase-light-4.png) [5](ios-showcase-light-5.png) [6](ios-showcase-light-6.png) | [1](android-showcase-light-1.png) [2](android-showcase-light-2.png) [3](android-showcase-light-3.png) [4](android-showcase-light-4.png) [5](android-showcase-light-5.png) [6](android-showcase-light-6.png) |
| Whole showcase, dark | [1](ios-showcase-dark-1.png) [2](ios-showcase-dark-2.png) [3](ios-showcase-dark-3.png) [4](ios-showcase-dark-4.png) [5](ios-showcase-dark-5.png) [6](ios-showcase-dark-6.png) | [1](android-showcase-dark-1.png) [2](android-showcase-dark-2.png) [3](android-showcase-dark-3.png) [4](android-showcase-dark-4.png) [5](android-showcase-dark-5.png) [6](android-showcase-dark-6.png) |
| Whole showcase, 200% text | [1](ios-large-text-showcase-1.png) [2](ios-large-text-showcase-2.png) [3](ios-large-text-showcase-3.png) [4](ios-large-text-showcase-4.png) [5](ios-large-text-showcase-5.png) [6](ios-large-text-showcase-6.png) [7](ios-large-text-showcase-7.png) [8](ios-large-text-showcase-8.png) [9](ios-large-text-showcase-9.png) [10](ios-large-text-showcase-10.png) [11](ios-large-text-showcase-11.png) [12](ios-large-text-showcase-12.png) [13](ios-large-text-showcase-13.png) | [1](android-large-text-showcase-1.png) [2](android-large-text-showcase-2.png) [3](android-large-text-showcase-3.png) [4](android-large-text-showcase-4.png) [5](android-large-text-showcase-5.png) [6](android-large-text-showcase-6.png) [7](android-large-text-showcase-7.png) |

Notes:

- The whole-showcase pages (`showcase-<appearance>-<n>`, `large-text-showcase-<n>`) come from `captureShowcase`, which
  scrolls to each section in turn; consecutive pages overlap (on Android at 200% the first row of light colour swatches
  falls between two pages; it is on the light and dark pages).
- Screenshots black out secure fields (the recovery secret) where the engine finds them; under a sheet or an alert,
  and on some iOS pages, the field shows empty (the demo value is never visible).
- The iOS alert is the system alert (React Native `Alert`); the Android one is the M3 `AlertDialog`.
- Android: a row swiped open keeps a grey pressed highlight until it closes (cosmetic, #195).
- Android screenshots are stabilized by agent-device (clock 9:41, no notification icons).

Commands run from the repo root:

```sh
pnpm --filter @budget-lens/mobile start --clear
adb -s <emulator-serial> reverse tcp:8073 tcp:8073
E2E_IOS_SIMULATOR=<simulator> pnpm e2e:ios
pnpm e2e:android
xcrun simctl ui <simulator> content_size accessibility-extra-large
adb -s <emulator-serial> shell settings put system font_scale 2.0
cd apps/mobile
E2E_LARGE_TEXT=1 E2E_IOS_SIMULATOR=<simulator> pnpm exec e2e run --target ios --output .e2e/ios-large-text e2e/large-text.e2e.ts
E2E_LARGE_TEXT=1 pnpm exec e2e run --target android --output .e2e/android-large-text e2e/large-text.e2e.ts
xcrun simctl ui <simulator> content_size large
adb -s <emulator-serial> shell settings put system font_scale 1.0
npx @react-native-reusables/cli@latest doctor --summary   # All checks passed
npx expo-doctor                                            # 20/20 checks passed
pnpm check
```
