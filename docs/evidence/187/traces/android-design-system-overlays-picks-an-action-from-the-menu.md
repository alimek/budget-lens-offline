# ✓ picks an action from the menu

`e2e/design-system-overlays.e2e.ts` · target `android` · passed · 13.8s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.3s) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (3.2s) — `e2e/support/showcase.ts:10`
   - expect passed after 23 reads in 3.2s: no node (0 matches) x22 -&gt; at 3199ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (249ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (249ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (607ms) — `e2e/support/showcase.ts:38`
   - tap button (607ms)
   - screen: 18 changes since step 3 at `com.budgetlens.offline`, 52 nodes
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-overlay-result")` (1.6s) — `e2e/design-system-overlays.e2e.ts:17`
   - screen: 72 changes since step 4 at `com.budgetlens.offline`, 84 nodes
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
     - 60 more
6. ✓ `locator.tap` `getByTestId("ds-menu") >> getByRole("button")` (143ms) — `e2e/support/showcase.ts:38`
   - tap button (143ms)
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `app.screenshot` `menu` (1.3s) — `e2e/design-system-overlays.e2e.ts:70`
   - [screenshot](attempt-1/screenshots/001-menu.png) `.e2e/android/results/design-system-overlays-picks-an-action-from-the-menu-063d3036b35aa1b4/attempt-1/screenshots/001-menu.png`
8. ✓ `locator.tap` `getByTestId("ds-menu-duplicate")` (271ms) — `e2e/design-system-overlays.e2e.ts:73`
   - tap group "ds-menu-duplicate" (271ms)
   - screen: 84 changes since step 6 at `com.budgetlens.offline`, 12 nodes
     - `added group testid="ds-menu-edit"`
     - `added text "Edit"`
     - `added group testid="ds-menu-duplicate"`
     - `added text "Duplicate"`
     - `added group testid="ds-menu-delete"`
     - `added text "Delete"`
     - `removed group`
     - `removed group`
     - `removed group`
     - `removed group testid="com.budgetlens.offline:id/action_bar_root"`
     - `removed group`
     - `removed group`
     - 72 more
9. ✓ `expect.toHaveCount` `getByTestId("ds-menu-duplicate")` (412ms) — `e2e/design-system-overlays.e2e.ts:76`
   - screen: 84 changes since step 8 at `com.budgetlens.offline`, 84 nodes
     - `added group testid="com.budgetlens.offline:id/action_bar_root"`
     - `added group`
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
     - 72 more
10. ✓ `expect.not.toHaveText` `getByTestId("ds-overlay-result")` (1.0s) — `e2e/design-system-overlays.e2e.ts:77`
   - expect passed after 7 reads in 1.0s
   - screen: unchanged since step 9 at `com.budgetlens.offline`

## Evidence

- [screenshot](attempt-1/screenshots/001-menu.png) `.e2e/android/results/design-system-overlays-picks-an-action-from-the-menu-063d3036b35aa1b4/attempt-1/screenshots/001-menu.png`

<sub>e2e 0.21.2 · run `01a15a89-0509-7b87-ba1d-1351665f42eb` · the whole run is in `report.json`</sub>
