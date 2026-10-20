# Design system slice 3 verification (#187)

Captured on 2026-10-20 from the Expo SDK 58 development builds (rebuilt for `react-native-gesture-handler` 3.3.0 and
Reanimated 4) using TesterArmy e2e 0.21.2 with `@e2e-dev/mobile`, Metro on the fixed port 8073 and
`E2E_TELEMETRY_DISABLED=1`. Only the dedicated simulator and emulator were used. No agent steps, model provider or
credentials. App code at `189a9a1`.

| Run | Device | Result | Duration | Run ID |
| --- | --- | --- | --- | --- |
| `pnpm e2e:ios` | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 22 passed, 4 skipped (large text) | 391.3 s | `01a15a60-4611-79ab-9b58-ab346949ac12` |
| `pnpm e2e:android` | dedicated Android emulator (`E2E_ANDROID_AVD`) | 22 passed, 4 skipped (large text) | 243.9 s | `01a15a66-5acb-721b-99db-d0468601074d` |
| `large-text.e2e.ts`, iOS at AX2 (`accessibility-extra-large`, about 200%) | same simulator | 4/4 passed | 114.4 s | `01a15a6f-daab-7e3f-b267-02eb70140788` |
| `large-text.e2e.ts`, Android at font scale 2.0 | same emulator | 4/4 passed | 60.5 s | `01a15a6b-d87a-7e87-a206-52de6f217819` |

The full runs cover `design-system-inputs.e2e.ts` (3), `design-system-list.e2e.ts` (4), `design-system-overlays.e2e.ts`
(3), `design-system.e2e.ts` (6) and `scaffold.e2e.ts` (6). The iOS large-text run is the one after the
`scrollShowcaseTo` fallback (an earlier run at AX2 failed with "scroll down moved nothing" when the engine's scroll
started on an embedded SwiftUI control). The [traces](traces/) are the per-test `trace.md` files of the new tests.

| Screenshot | iOS | Android |
| --- | --- | --- |
| `AppSheet` from "Show details" | [ios](ios-sheet.png) | [android](android-sheet.png) |
| `AppAlert` from "Close month" | [ios](ios-alert.png) | [android](android-alert.png) |
| `AppContextMenu` "More actions" | [ios](ios-menu.png) | [android](android-menu.png) |
| List example: "Rent" swiped open (Edit, Delete) | [ios](ios-list-swipe.png) | [android](android-list-swipe.png) |
| List example: "Edit" swipe action opens the sheet | [ios](ios-list-edit-sheet.png) | [android](android-list-edit-sheet.png) |
| The five above side by side | [ios](ios-overlays.png) | [android](android-overlays.png) |
| Whole showcase, light | [ios](ios-showcase-light.png) | [android](android-showcase-light.png) |
| Whole showcase, dark | [ios](ios-showcase-dark.png) | [android](android-showcase-dark.png) |
| Whole showcase, 200% text | [ios](ios-large-text-showcase.png) | [android](android-large-text-showcase.png) |

Notes:

- The single screenshots are the unmodified `app.screenshot()` output. The "side by side" and "whole showcase" images
  are montages of the unmodified `showcase-<appearance>-<n>` / `large-text-showcase-<n>` pages of the same runs, in
  order and scaled to one height; consecutive pages overlap.
- Screenshots black out secure fields (the recovery secret) where the engine can find them; under a sheet or an alert
  the field is shown dimmed and empty.
- The iOS alert is the system alert (React Native `Alert`); the Android one is the M3 `AlertDialog`.
- Android: a row swiped open keeps a grey pressed highlight until it closes (cosmetic; a swipe does not toggle the
  paid state).
- Android screenshots are stabilized by agent-device (clock 9:41, no notification icons).

Commands run from the repo root:

```sh
pnpm --filter @budget-lens/mobile start
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
