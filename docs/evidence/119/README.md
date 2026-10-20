# Design system verification (#119)

Captured on 2026-10-20 from the Expo SDK 58 development builds using TesterArmy e2e 0.21.2 with
`@e2e-dev/mobile` 0.12.3, Metro on the fixed port 8073 and `E2E_TELEMETRY_DISABLED=1`. Only dedicated
simulators/emulators were used. No agent steps, model provider or credentials.

| Platform | Device | Result | Run |
| --- | --- | --- | --- |
| iOS | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 10/10 passed | `01a1591a-222d-7f44-bb4a-955f309fa263` ([trace](ios-design-system-light-trace.md)) |
| Android | dedicated Android emulator (`E2E_ANDROID_AVD`) | 10/10 passed | `01a15919-3b0d-750b-890a-a528c00247e2` ([trace](android-design-system-light-trace.md)) |

Each run covers `e2e/design-system.e2e.ts` (4 tests) and `e2e/scaffold.e2e.ts` (6 tests). The screenshots are the
unmodified `app.screenshot()` output of those runs:

| Screenshot | iOS | Android |
| --- | --- | --- |
| Showcase, light: card, badge, amounts, buttons, toggle, segmented control, progress | [ios](ios-design-system-light.png) | [android](android-design-system-light.png) |
| Showcase, dark (`device.setAppearance("dark")`) | [ios](ios-design-system-dark.png) | [android](android-design-system-dark.png) |
| Type scale | [ios](ios-design-system-typography.png) | [android](android-design-system-typography.png) |
| Colour tokens, light and dark | [ios](ios-design-system-tokens.png) | [android](android-design-system-tokens.png) |
| Overview (migrated to the card and native secondary button) | [ios](ios-overview.png) | [android](android-overview.png) |
| Savings (pushed from the Overview card) | [ios](ios-savings.png) | [android](android-savings.png) |

The traces are those of the "shows the design system components in light mode" test. Android screenshots are
stabilized by agent-device (clock 9:41, no notification icons), so captures of an unchanged screen can be identical
across runs; the traces carry the run IDs ([evidence/15](../15/README.md)).

Commands run from the repo root:

```sh
pnpm --filter @budget-lens/mobile start
adb -s <emulator-serial> reverse tcp:8073 tcp:8073
pnpm e2e:android
pnpm e2e:ios
pnpm check
```
