# ✓ opens the sheet and closes it with its button

`e2e/design-system-overlays.e2e.ts` · target `android` · passed · 13.0s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.4s) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (3.2s) — `e2e/support/showcase.ts:10`
   - expect passed after 19 reads in 3.2s: no node (0 matches) x18 -&gt; at 3213ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (242ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (242ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (503ms) — `e2e/support/showcase.ts:38`
   - tap button (503ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-overlay-result")` (1.2s) — `e2e/design-system-overlays.e2e.ts:17`
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
6. ✓ `locator.tap` `getByTestId("ds-open-sheet") >> getByRole("button")` (185ms) — `e2e/support/showcase.ts:38`
   - tap button (185ms)
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `locator.tap` `getByTestId("ds-sheet-done") >> getByRole("button")` (125ms) — `e2e/design-system-overlays.e2e.ts:32`
   - tap button (125ms)
   - screen: 74 changes since step 6 at `com.budgetlens.offline`, 24 nodes
     - `added group "Close sheet"`
     - `added group "Drag handle"`
     - `added group testid="ds-sheet"`
     - `added heading "Rent, October 2026"`
     - `added text "Due 10 October. Paid by bank transfer."`
     - `added group testid="ds-sheet-done"`
     - `added text "Done"`
     - `removed group`
     - `removed group`
     - `removed group`
     - `removed group testid="com.budgetlens.offline:id/action_bar_root"`
     - `removed group`
     - 62 more
8. ✓ `expect.toHaveCount` `getByTestId("ds-sheet")` (165ms) — `e2e/design-system-overlays.e2e.ts:35`
   - screen: 74 changes since step 7 at `com.budgetlens.offline`, 84 nodes
     - `added group testid="com.budgetlens.offline:id/action_bar_root"`
     - `added button "Navigate up"`
     - `added text "Design system"`
     - `added group testid="screen-design-system"`
     - `added group`
     - `added group testid="ds-section-components"`
     - `added progressbar "Groceries, 60% used" testid="ds-progress"`
     - `added text "Groceries"`
     - `added group`
     - `added progressbar`
     - `added text "60% used" testid="ds-progress-status"`
     - `added progressbar "Eating out, Over budget: 120% used" testid="ds-progress-over"`
     - 62 more
9. ✓ `locator.tap` `getByTestId("ds-open-sheet") >> getByRole("button")` (521ms) — `e2e/support/showcase.ts:38`
   - tap button (521ms)
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `app.screenshot` `sheet` (1.3s) — `e2e/design-system-overlays.e2e.ts:38`
   - [screenshot](attempt-1/screenshots/001-sheet.png) `.e2e/android/results/design-system-overlays-opens-the-sheet-and-closes-it-aaae46544b339820/attempt-1/screenshots/001-sheet.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-sheet.png) `.e2e/android/results/design-system-overlays-opens-the-sheet-and-closes-it-aaae46544b339820/attempt-1/screenshots/001-sheet.png`

<sub>e2e 0.21.2 · run `01a15a66-5acb-721b-99db-d0468601074d` · the whole run is in `report.json`</sub>
