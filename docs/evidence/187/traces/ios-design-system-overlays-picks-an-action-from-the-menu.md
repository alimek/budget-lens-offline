# ✓ picks an action from the menu

`e2e/design-system-overlays.e2e.ts` · target `ios` · passed · 21.1s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.1s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 5 reads in 2.1s: no node (0 matches) x4 -&gt; at 2146ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (774ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (774ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (802ms, video 0:05) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (802ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-overlay-result")` (3.2s, video 0:06) — `e2e/design-system-overlays.e2e.ts:17`
   - screen: 60 changes since step 4 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-inputs"`
     - `added text "INPUTS"`
     - `added text "INPUTS"`
     - `added textbox "Name" testid="ds-text-field" value="e.g. Rent"`
     - `added textbox "Amount" testid="ds-amount-field" value="12,345"`
     - `added text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `added text "Use at most 2 decimal places"`
     - `added textbox "Recovery secret" testid="ds-secure-field" value=<secure> purpose=password [secure]`
     - 48 more
6. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-menu")` (205ms, video 0:10) — `e2e/design-system-overlays.e2e.ts:66`
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `locator.tap` `getByTestId("ds-menu")` (1.4s, video 0:11) — `e2e/support/showcase.ts:38`
   - tap pop-up-button "More actions" (1.4s)
   - screen: unchanged since step 6 at `com.budgetlens.offline / Design system`
8. ✓ `app.screenshot` `menu` (769ms, video 0:13) — `e2e/design-system-overlays.e2e.ts:70`
   - [screenshot](attempt-1/screenshots/001-menu.png) `.e2e/ios/results/design-system-overlays-picks-an-action-from-the-menu-dafb6f49d4524d32/attempt-1/screenshots/001-menu.png`
9. ✓ `locator.tap` `getByTestId("ds-menu-duplicate")` (1.5s, video 0:14) — `e2e/design-system-overlays.e2e.ts:73`
   - tap button "Duplicate" (1.5s)
   - screen: 11 changes since step 7 at `com.budgetlens.offline / Design system`, 57 nodes
     - `added collection-view`
     - `added listitem`
     - `added button "Edit" testid="ds-menu-edit"`
     - `added listitem`
     - `added button "Duplicate" testid="ds-menu-duplicate"`
     - `added listitem`
     - `added button "Delete" testid="ds-menu-delete"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
10. ✓ `expect.toHaveCount` `getByTestId("ds-menu-duplicate")` (216ms, video 0:15) — `e2e/design-system-overlays.e2e.ts:76`
   - screen: 15 changes since step 9 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added text "Last action: Duplicate" testid="ds-overlay-result"`
     - `added text "Last action: Duplicate"`
     - `removed text "Last action: none" testid="ds-overlay-result"`
     - `removed text "Last action: none"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed collection-view`
     - `removed listitem`
     - `removed button "Edit" testid="ds-menu-edit"`
     - `removed listitem`
     - `removed button "Duplicate" testid="ds-menu-duplicate"`
     - `removed listitem`
     - 3 more
11. ✓ `expect.not.toHaveText` `getByTestId("ds-overlay-result")` (1.2s, video 0:15) — `e2e/design-system-overlays.e2e.ts:77`
   - expect passed after 4 reads in 1.2s
   - screen: unchanged since step 10 at `com.budgetlens.offline / Design system`

## Evidence

- [screenshot](attempt-1/screenshots/001-menu.png) `.e2e/ios/results/design-system-overlays-picks-an-action-from-the-menu-dafb6f49d4524d32/attempt-1/screenshots/001-menu.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-overlays-picks-an-action-from-the-menu-dafb6f49d4524d32/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a60-4611-79ab-9b58-ab346949ac12` · the whole run is in `report.json`</sub>
