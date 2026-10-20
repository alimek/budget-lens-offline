# ✓ picks an option from the native picker menu

`e2e/design-system-inputs.e2e.ts` · target `ios` · passed · 21.9s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.9s, video 0:01) — `e2e/support/showcase.ts:10`
   - screen: 32 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (629ms, video 0:03) — `e2e/support/showcase.ts:38`
   - tap button "Settings" (629ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (645ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (645ms)
   - screen: 22 changes since step 3 at `com.budgetlens.offline / Settings`, 30 nodes
     - `added other "Settings"`
     - `added navigation "Settings" testid="Settings"`
     - `added text "Settings"`
     - `added other "Your budget stays on this device." testid="screen-settings"`
     - `added scroll-view "Your budget stays on this device."`
     - `added other "Your budget stays on this device."`
     - `added other "Open design system"`
     - `added button "Open design system" testid="settings-open-design-system"`
     - `added button "Overview" testid="tab-overview"`
     - `added button "Settings" testid="tab-settings" [selected]`
     - `removed other "Overview"`
     - `removed navigation "Overview" testid="Overview"`
     - 10 more
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (3.6s, video 0:06) — `e2e/design-system-inputs.e2e.ts:41`
   - screen: 77 changes since step 4 at `com.budgetlens.offline / Design system`, 57 nodes
     - `added other "Back"`
     - `added navigation "Back" testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other "Vertical scroll bar, 5 pages"`
     - `added other "Vertical scroll bar, 5 pages" testid="screen-design-system"`
     - `added scroll-view "COMPONENTS"`
     - `added other "COMPONENTS"`
     - `added other "COMPONENTS" testid="ds-section-components"`
     - `added other testid="ds-card"`
     - `added text "Projected closing balance"`
     - `added text "PLN 3,895.67" text="PLN 3,895.67" testid="ds-amount-total"`
     - 65 more
6. ✓ `locator.tap` `getByTestId("ds-picker")` (1.7s, video 0:10) — `e2e/design-system-inputs.e2e.ts:43`
   - tap button "Repeats, Every month" (1.7s)
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `expect.toBeVisible` `getByTestId("ds-picker-yearly")` (437ms, video 0:12) — `e2e/design-system-inputs.e2e.ts:44`
   - screen: 65 changes since step 6 at `com.budgetlens.offline`, 14 nodes
     - `added other "Vertical scroll bar, 1 page"`
     - `added other "Once"`
     - `added collection-view "Once"`
     - `added listitem "Once"`
     - `added button "Once" testid="ds-picker-once"`
     - `added listitem "Every month"`
     - `added button "Every month" testid="ds-picker-monthly" [selected]`
     - `added image "selected" testid="checkmark"`
     - `added listitem "Every year"`
     - `added button "Every year" testid="ds-picker-yearly"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `removed other "Toolbar"`
     - 53 more
8. ✓ `locator.tap` `getByTestId("ds-picker-yearly")` (1.7s, video 0:12) — `e2e/design-system-inputs.e2e.ts:47`
   - tap button "Every year" (1.7s)
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toHaveCount` `getByTestId("ds-picker-yearly")` (498ms, video 0:14) — `e2e/design-system-inputs.e2e.ts:50`
   - screen: 65 changes since step 8 at `com.budgetlens.offline / Design system`, 57 nodes
     - `added other "Toolbar"`
     - `added other "Back"`
     - `added navigation "Back" testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other "Vertical scroll bar, 5 pages"`
     - `added other "Vertical scroll bar, 5 pages" testid="screen-design-system"`
     - `added scroll-view "COMPONENTS"`
     - `added other "COMPONENTS"`
     - `added other "COMPONENTS" testid="ds-section-components"`
     - `added other testid="ds-card"`
     - `added text "Projected closing balance"`
     - 53 more
10. ✓ `locator.tap` `getByTestId("ds-picker")` (1.7s, video 0:14) — `e2e/design-system-inputs.e2e.ts:51`
   - tap button "Repeats, Every year" (1.7s)
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `expect.toBeVisible` `getByTestId("ds-picker-yearly")` (438ms, video 0:16) — `e2e/design-system-inputs.e2e.ts:52`
   - screen: 65 changes since step 10 at `com.budgetlens.offline`, 14 nodes
     - `added other "Vertical scroll bar, 1 page"`
     - `added other "Once"`
     - `added collection-view "Once"`
     - `added listitem "Once"`
     - `added button "Once" testid="ds-picker-once"`
     - `added listitem "Every month"`
     - `added button "Every month" testid="ds-picker-monthly"`
     - `added listitem "Every year"`
     - `added button "Every year" testid="ds-picker-yearly" [selected]`
     - `added image "selected" testid="checkmark"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `removed other "Toolbar"`
     - 53 more
12. ✓ `app.screenshot` `picker-menu` (961ms, video 0:16) — `e2e/design-system-inputs.e2e.ts:53`
   - [screenshot](attempt-1/screenshots/001-picker-menu.png) `.e2e/ios/results/design-system-inputs-picks-an-option-from-the-native-9f9ce39d6977d67a/attempt-1/screenshots/001-picker-menu.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-picker-menu.png) `.e2e/ios/results/design-system-inputs-picks-an-option-from-the-native-9f9ce39d6977d67a/attempt-1/screenshots/001-picker-menu.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-inputs-picks-an-option-from-the-native-9f9ce39d6977d67a/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159ae-376c-74dc-92a5-24dd27d45bc0` · the whole run is in `report.json`</sub>
