# ✓ picks an option from the native picker menu

`e2e/design-system-inputs.e2e.ts` · target `ios` · passed · 18.4s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s, video 0:01) — `e2e/support/showcase.ts:10`
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (770ms, video 0:03) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (770ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (799ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (799ms)
   - screen: 15 changes since step 3 at `com.budgetlens.offline / Settings`, 26 nodes
     - `added navigation testid="Settings"`
     - `added text "Settings"`
     - `added other testid="screen-settings"`
     - `added button "Open design system" testid="settings-open-design-system"`
     - `added tab "Overview" testid="tab-overview"`
     - `added tab "Settings" testid="tab-settings" [selected]`
     - `removed navigation testid="Overview"`
     - `removed text "Overview"`
     - `removed other testid="screen-home"`
     - `removed other testid="overview-savings-card"`
     - `removed text "Savings"`
     - `removed text "Savings"`
     - 3 more
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (2.1s, video 0:06) — `e2e/design-system-inputs.e2e.ts:41`
   - screen: 60 changes since step 4 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added button "Add item" testid="ds-primary-button"`
     - `added button "Close month" testid="ds-secondary-button"`
     - `added switch "Privacy mode" testid="ds-toggle" value="0"`
     - `added text "Privacy mode"`
     - `added switch value="0"`
     - `added tablist testid="ds-segmented"`
     - `added tab "Only this month" [selected]`
     - 48 more
6. ✓ `locator.tap` `getByTestId("ds-picker")` (1.4s, video 0:08) — `e2e/design-system-inputs.e2e.ts:43`
   - tap button "Repeats, Every month" (1.4s)
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `expect.toBeVisible` `getByTestId("ds-picker-yearly")` (223ms, video 0:09) — `e2e/design-system-inputs.e2e.ts:44`
   - screen: 12 changes since step 6 at `com.budgetlens.offline / Design system`, 58 nodes
     - `added collection-view`
     - `added listitem`
     - `added button "Once" testid="ds-picker-once"`
     - `added listitem`
     - `added button "Every month" testid="ds-picker-monthly" [selected]`
     - `added image "selected" testid="checkmark"`
     - `added listitem`
     - `added button "Every year" testid="ds-picker-yearly"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
8. ✓ `locator.tap` `getByTestId("ds-picker-yearly")` (1.8s, video 0:10) — `e2e/design-system-inputs.e2e.ts:47`
   - tap button "Every year" (1.8s)
   - screen: unchanged since step 7 at `com.budgetlens.offline / Design system`
9. ✓ `expect.toHaveCount` `getByTestId("ds-picker-yearly")` (214ms, video 0:11) — `e2e/design-system-inputs.e2e.ts:50`
   - screen: 16 changes since step 8 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added button "Repeats, Every year" testid="ds-picker"`
     - `added text "Every year"`
     - `removed button "Repeats, Every month" testid="ds-picker"`
     - `removed text "Every month"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed collection-view`
     - `removed listitem`
     - `removed button "Once" testid="ds-picker-once"`
     - `removed listitem`
     - `removed button "Every month" testid="ds-picker-monthly" [selected]`
     - `removed image "selected" testid="checkmark"`
     - 4 more
10. ✓ `locator.tap` `getByTestId("ds-picker")` (1.7s, video 0:12) — `e2e/design-system-inputs.e2e.ts:51`
   - tap button "Repeats, Every year" (1.7s)
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `expect.toBeVisible` `getByTestId("ds-picker-yearly")` (221ms, video 0:13) — `e2e/design-system-inputs.e2e.ts:52`
   - screen: 12 changes since step 10 at `com.budgetlens.offline / Design system`, 58 nodes
     - `added collection-view`
     - `added listitem`
     - `added button "Once" testid="ds-picker-once"`
     - `added listitem`
     - `added button "Every month" testid="ds-picker-monthly"`
     - `added listitem`
     - `added button "Every year" testid="ds-picker-yearly" [selected]`
     - `added image "selected" testid="checkmark"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
12. ✓ `app.screenshot` `picker-menu` (755ms, video 0:13) — `e2e/design-system-inputs.e2e.ts:53`
   - [screenshot](attempt-1/screenshots/001-picker-menu.png) `.e2e/ios/results/design-system-inputs-picks-an-option-from-the-native-9f9ce39d6977d67a/attempt-1/screenshots/001-picker-menu.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-picker-menu.png) `.e2e/ios/results/design-system-inputs-picks-an-option-from-the-native-9f9ce39d6977d67a/attempt-1/screenshots/001-picker-menu.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-inputs-picks-an-option-from-the-native-9f9ce39d6977d67a/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159cb-b68f-7040-977a-1fa30cd7f30b` · the whole run is in `report.json`</sub>
