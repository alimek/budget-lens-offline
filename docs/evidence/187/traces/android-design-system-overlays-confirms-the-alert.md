# ✓ confirms the alert

`e2e/design-system-overlays.e2e.ts` · target `android` · passed · 13.4s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.4s) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (3.1s) — `e2e/support/showcase.ts:10`
   - expect passed after 18 reads in 3.1s: no node (0 matches) x17 -&gt; at 3076ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (245ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (245ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (211ms) — `e2e/support/showcase.ts:38`
   - tap button (211ms)
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
6. ✓ `locator.tap` `getByTestId("ds-open-alert") >> getByRole("button")` (149ms) — `e2e/support/showcase.ts:38`
   - tap button (149ms)
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `app.screenshot` `alert` (1.2s) — `e2e/design-system-overlays.e2e.ts:49`
   - [screenshot](attempt-1/screenshots/001-alert.png) `.e2e/android/results/design-system-overlays-confirms-the-alert-6583d4fe7f10a4ef/attempt-1/screenshots/001-alert.png`
8. ✓ `locator.tap` `getByTestId("ds-alert-confirm") >> getByRole("button")` (323ms) — `e2e/design-system-overlays.e2e.ts:52`
   - tap button (323ms)
   - screen: 77 changes since step 6 at `com.budgetlens.offline`, 17 nodes
     - `added text "Close October?"`
     - `added text "Items and amounts of October can no longer be changed."`
     - `added group testid="ds-alert-confirm"`
     - `added group testid="ds-alert-cancel"`
     - `added text "Cancel"`
     - `removed group`
     - `removed group`
     - `removed group`
     - `removed group testid="com.budgetlens.offline:id/action_bar_root"`
     - `removed group`
     - `removed group`
     - `removed group`
     - 65 more
9. ✓ `expect.toHaveCount` `getByTestId("ds-alert-confirm") >> getByRole("button")` (171ms) — `e2e/design-system-overlays.e2e.ts:55`
   - screen: 77 changes since step 8 at `com.budgetlens.offline`, 84 nodes
     - `added group testid="com.budgetlens.offline:id/action_bar_root"`
     - `added group`
     - `added group`
     - `added group`
     - `added group`
     - `added group`
     - `added button "Navigate up"`
     - `added text "Design system"`
     - `added group`
     - `added group`
     - `added group testid="screen-design-system"`
     - `added group`
     - 65 more
10. ✓ `expect.not.toHaveText` `getByTestId("ds-overlay-result")` (1.1s) — `e2e/design-system-overlays.e2e.ts:56`
   - expect passed after 7 reads in 1.1s
   - screen: unchanged since step 9 at `com.budgetlens.offline`

## Evidence

- [screenshot](attempt-1/screenshots/001-alert.png) `.e2e/android/results/design-system-overlays-confirms-the-alert-6583d4fe7f10a4ef/attempt-1/screenshots/001-alert.png`

<sub>e2e 0.21.2 · run `01a15a66-5acb-721b-99db-d0468601074d` · the whole run is in `report.json`</sub>
