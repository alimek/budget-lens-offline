# Design system slice 2 verification (#182)

Captured on 2026-10-20 from the Expo SDK 58 development builds using TesterArmy e2e 0.21.2 with
`@e2e-dev/mobile` 0.12.3, Metro on the fixed port 8073 and `E2E_TELEMETRY_DISABLED=1`. Only the dedicated
simulator and emulator were used. No agent steps, model provider or credentials. App code at `56cd43d` (after review round 1).

| Run | Device | Result | Duration | Run ID |
| --- | --- | --- | --- | --- |
| `pnpm e2e:ios` | dedicated iOS simulator (`E2E_IOS_SIMULATOR`) | 17 passed, 3 skipped (large text) | 213.3 s | `01a159cb-b68f-7040-977a-1fa30cd7f30b` |
| `pnpm e2e:android` | dedicated Android emulator (`E2E_ANDROID_AVD`) | 17 passed, 3 skipped (large text) | 124.1 s | `01a159c9-cc37-7f6c-a432-4039abd51cf8` |
| `large-text.e2e.ts`, iOS at AX2 (`accessibility-extra-large`, about 200%) | same simulator | 3/3 passed | 38.6 s | `01a159cf-95f8-764e-b0ca-0e2c15a28d91` |
| `large-text.e2e.ts`, Android at font scale 2.0 | same emulator | 3/3 passed | 22.8 s | `01a159cf-37cc-74cc-94fc-c6300a7f999f` |

The full runs cover `design-system-inputs.e2e.ts` (3), `design-system-list.e2e.ts` (2), `design-system.e2e.ts` (6)
and `scaffold.e2e.ts` (6). The screenshots are the unmodified `app.screenshot()` output of those runs; the
[traces](traces/) are the per-test `trace.md` files of the new tests.

| Screenshot | iOS | Android |
| --- | --- | --- |
| Inputs: text, amount with validation error, secure, picker, date | [ios](ios-inputs-error.png) | [android](android-inputs-error.png) |
| Picker menu reopened after choosing "Every year" | [ios](ios-picker-menu.png) | [android](android-picker-menu.png) |
| Native calendar from the date picker | [ios](ios-date-picker.png) | [android](android-date-picker.png) |
| List example after toggling "Rent" to paid ("Internet" is a EUR item, formatted in its own currency) | [ios](ios-list.png) | [android](android-list.png) |
| List example after the add button (iOS toolbar `+`, Android FAB) | [ios](ios-list-added.png) | [android](android-list-added.png) |
| 200%: showcase components | [ios](ios-large-text-components.png) | [android](android-large-text-components.png) |
| 200%: inputs | [ios](ios-large-text-inputs.png) | [android](android-large-text-inputs.png) |
| 200%: list example | [ios](ios-large-text-list.png) | [android](android-large-text-list.png) |

Notes:

- Screenshots black out secure fields (the recovery secret), also where a popover or the keyboard covers them. The
  list example is opened by deep link so the showcase is not underneath it.
- Android 14+ scales text non-linearly, so at font scale 2.0 large text grows less than body text.
- Android screenshots are stabilized by agent-device (clock 9:41, no notification icons), so captures of an
  unchanged screen are identical across runs; the traces carry the run IDs ([evidence/15](../15/README.md)).

Accessibility on Android: `android-uiautomator-inputs.xml` and `android-uiautomator-list.xml` are
`uiautomator dump` output of the showcase inputs and the list example on the same emulator. They show the text
fields as `EditText` with their label as a child text (read by TalkBack with the field), the date field as a button
named "Due date, Oct 10, 2026" (its inner Compose field disabled and not focusable), each transaction row as a
checkable node with its checked state and the name "Paid: <title>" (`transaction.paidLabel`, as on iOS; because the
row also has text, Compose exposes that content description as a non-focusable child of the checkbox node, which
TalkBack reads with the row), and the FAB as a button named "Add item". A development-only LogBox toast
(about the linking configuration, shown because the dumps opened the screens with `am start` while the app was
running; tracked in #188) was removed from the dumps where it appeared.

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
pnpm check
```
