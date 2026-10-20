# Design system verification (#119)

Captured on 2026-10-20 from the Expo SDK 58 development builds using TesterArmy e2e 0.21.2 with
`@e2e-dev/mobile` 0.12.3, Metro on the fixed port 8073 and `E2E_TELEMETRY_DISABLED=1`. Only dedicated
simulators/emulators were used. No agent steps, model provider or credentials.

| Platform | Device | Result | Run |
| --- | --- | --- | --- |
| iOS | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 12/12 passed | `01a1592c-d63a-787c-be12-353294229af8` ([trace](ios-design-system-light-trace.md)) |
| Android | dedicated Android emulator (`E2E_ANDROID_AVD`) | 12/12 passed | `01a1592e-df17-70c3-9593-42b8b7956d79` ([trace](android-design-system-light-trace.md)) |

Each run covers `e2e/design-system.e2e.ts` (6 tests, including the toggle and progress accessibility checks) and `e2e/scaffold.e2e.ts` (6 tests). The screenshots are the
unmodified `app.screenshot()` output of those runs:

| Screenshot | iOS | Android |
| --- | --- | --- |
| Showcase, light: card, badge, amounts, buttons, toggle, segmented control, budget progress with status text | [ios](ios-design-system-light.png) | [android](android-design-system-light.png) |
| Showcase, dark (`device.setAppearance("dark")`) | [ios](ios-design-system-dark.png) | [android](android-design-system-dark.png) |
| Type scale | [ios](ios-design-system-typography.png) | [android](android-design-system-typography.png) |
| Colour tokens, light and dark | [ios](ios-design-system-tokens.png) | [android](android-design-system-tokens.png) |
| Overview (migrated to the card and native secondary button) | [ios](ios-overview.png) | [android](android-overview.png) |
| Savings (pushed from the Overview card) | [ios](ios-savings.png) | [android](android-savings.png) |
| Settings (card and the development-only design system button) | [ios](ios-settings.png) | [android](android-settings.png) |

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
