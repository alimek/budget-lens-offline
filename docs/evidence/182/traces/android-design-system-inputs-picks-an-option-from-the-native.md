# ✓ picks an option from the native picker menu

`e2e/design-system-inputs.e2e.ts` · target `android` · passed · 10.1s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.6s) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.5s) — `e2e/support/showcase.ts:10`
   - expect passed after 8 reads in 1.5s: no node (0 matches) x7 -&gt; at 1506ms default states (1 match)
   - screen: 51 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (322ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (322ms)
   - screen: 2 changes since step 2 at `com.budgetlens.offline`, 53 nodes
     - `added image testid="com.budgetlens.offline:id/navigation_bar_item_icon_view" [selected]`
     - `added text "Overview" testid="com.budgetlens.offline:id/navigation_bar_item_large_label_view" [selected]`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (396ms) — `e2e/support/showcase.ts:38`
   - tap button (396ms)
   - screen: 18 changes since step 3 at `com.budgetlens.offline`, 51 nodes
     - `added text "Settings"`
     - `added group testid="screen-settings"`
     - `added group testid="settings-open-design-system"`
     - `added text "Open design system"`
     - `added tab "Overview" testid="tab-overview"`
     - `added text "Overview" testid="com.budgetlens.offline:id/navigation_bar_item_small_label_view"`
     - `added tab "Settings" testid="tab-settings" [selected]`
     - `added text "Settings" testid="com.budgetlens.offline:id/navigation_bar_item_large_label_view" [selected]`
     - `removed text "Overview"`
     - `removed group testid="screen-home"`
     - `removed group testid="overview-savings-card"`
     - `removed heading "Savings"`
     - 6 more
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (1.2s) — `e2e/design-system-inputs.e2e.ts:41`
   - screen: 63 changes since step 4 at `com.budgetlens.offline`, 74 nodes
     - `added button "Navigate up"`
     - `added text "Design system"`
     - `added group testid="screen-design-system"`
     - `added group testid="ds-section-components"`
     - `added progressbar "Groceries, 60% used" testid="ds-progress"`
     - `added text "Groceries"`
     - `added progressbar`
     - `added text "60% used" testid="ds-progress-status"`
     - `added progressbar "Eating out, Over budget: 120% used" testid="ds-progress-over"`
     - `added text "Eating out"`
     - `added progressbar`
     - `added text "Over budget: 120% used" testid="ds-progress-over-status"`
     - 51 more
6. ✓ `locator.tap` `getByTestId("ds-picker")` (212ms) — `e2e/design-system-inputs.e2e.ts:43`
   - tap textbox "Every month" (212ms)
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `expect.toBeVisible` `getByTestId("ds-picker-yearly")` (271ms) — `e2e/design-system-inputs.e2e.ts:44`
   - screen: 74 changes since step 6 at `com.budgetlens.offline`, 12 nodes
     - `added group testid="ds-picker-once"`
     - `added text "Once"`
     - `added group testid="ds-picker-monthly"`
     - `added text "Every month"`
     - `added group testid="ds-picker-yearly"`
     - `added text "Every year"`
     - `removed group`
     - `removed group`
     - `removed group`
     - `removed group testid="com.budgetlens.offline:id/action_bar_root"`
     - `removed group`
     - `removed group`
     - 62 more
8. ✓ `locator.tap` `getByTestId("ds-picker-yearly")` (430ms) — `e2e/design-system-inputs.e2e.ts:47`
   - tap group "ds-picker-yearly" (430ms)
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toHaveCount` `getByTestId("ds-picker-yearly")` (468ms) — `e2e/design-system-inputs.e2e.ts:50`
   - screen: 74 changes since step 8 at `com.budgetlens.offline`, 74 nodes
     - `added group testid="com.budgetlens.offline:id/action_bar_root"`
     - `added group`
     - `added group`
     - `added group`
     - `added group`
     - `added group`
     - `added group`
     - `added group`
     - `added button "Navigate up"`
     - `added text "Design system"`
     - `added group`
     - `added group`
     - 62 more
10. ✓ `locator.tap` `getByTestId("ds-picker")` (134ms) — `e2e/design-system-inputs.e2e.ts:51`
   - tap textbox "Every year" (134ms)
   - screen: unchanged since step 9 at `com.budgetlens.offline`
11. ✓ `expect.toBeVisible` `getByTestId("ds-picker-yearly")` (285ms) — `e2e/design-system-inputs.e2e.ts:52`
   - screen: 74 changes since step 10 at `com.budgetlens.offline`, 12 nodes
     - `added group testid="ds-picker-once"`
     - `added text "Once"`
     - `added group testid="ds-picker-monthly"`
     - `added text "Every month"`
     - `added group testid="ds-picker-yearly"`
     - `added text "Every year"`
     - `removed group`
     - `removed group`
     - `removed group`
     - `removed group testid="com.budgetlens.offline:id/action_bar_root"`
     - `removed group`
     - `removed group`
     - 62 more
12. ✓ `app.screenshot` `picker-menu` (1.3s) — `e2e/design-system-inputs.e2e.ts:53`
   - [screenshot](attempt-1/screenshots/001-picker-menu.png) `.e2e/android/results/design-system-inputs-picks-an-option-from-the-native-5e00b1ec317a2e3c/attempt-1/screenshots/001-picker-menu.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-picker-menu.png) `.e2e/android/results/design-system-inputs-picks-an-option-from-the-native-5e00b1ec317a2e3c/attempt-1/screenshots/001-picker-menu.png`

<sub>e2e 0.21.2 · run `01a159b1-8fe8-7e30-9ff1-8be53825706b` · the whole run is in `report.json`</sub>
