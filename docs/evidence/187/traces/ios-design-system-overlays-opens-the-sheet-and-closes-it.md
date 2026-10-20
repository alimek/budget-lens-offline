# ✓ opens the sheet and closes it with its button

`e2e/design-system-overlays.e2e.ts` · target `ios` · passed · 23.3s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.2s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 5 reads in 2.2s: no node (0 matches) x4 -&gt; at 2177ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (772ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (772ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (811ms, video 0:05) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (811ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-overlay-result")` (3.3s, video 0:06) — `e2e/design-system-overlays.e2e.ts:17`
   - screen: 60 changes since step 4 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added other "Groceries" testid="ds-progress" value="60% used"`
     - `added text "60% used" testid="ds-progress-status"`
     - `added text "60% used"`
     - `added other "Eating out" testid="ds-progress-over" value="Over budget: 120% used"`
     - `added text "Over budget: 120% used" testid="ds-progress-over-status"`
     - `added text "Over budget: 120% used"`
     - `added other testid="ds-section-inputs"`
     - 48 more
6. ✓ `locator.tap` `getByTestId("ds-open-sheet")` (1.4s, video 0:10) — `e2e/support/showcase.ts:38`
   - tap button "Show details" (1.4s)
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `locator.tap` `getByTestId("ds-sheet-done")` (1.5s, video 0:13) — `e2e/design-system-overlays.e2e.ts:32`
   - tap button "Done" (1.5s)
   - screen: 52 changes since step 6 at `com.budgetlens.offline`, 10 nodes
     - `added other "dismiss popup" testid="PopoverDismissRegion"`
     - `added button "Sheet Grabber" value="Collapsed"`
     - `added other testid="ds-sheet"`
     - `added text "Rent, October 2026"`
     - `added text "Rent, October 2026"`
     - `added text "Due 10 October. Paid by bank transfer."`
     - `added text "Due 10 October. Paid by bank transfer."`
     - `added button "Done" testid="ds-sheet-done"`
     - `removed navigation testid="Design system"`
     - `removed button "Back" testid="BackButton"`
     - `removed text "Design system"`
     - `removed other testid="screen-design-system"`
     - 40 more
8. ✓ `expect.toHaveCount` `getByTestId("ds-sheet")` (544ms, video 0:14) — `e2e/design-system-overlays.e2e.ts:35`
   - expect passed after 2 reads in 544ms: count 1 (1 match) -&gt; at 544ms count 0 (0 matches)
   - screen: 52 changes since step 7 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added scroll-view`
     - `added other testid="ds-section-components"`
     - `added other "Groceries" testid="ds-progress" value="60% used"`
     - `added text "60% used" testid="ds-progress-status"`
     - `added text "60% used"`
     - `added other "Eating out" testid="ds-progress-over" value="Over budget: 120% used"`
     - `added text "Over budget: 120% used" testid="ds-progress-over-status"`
     - `added text "Over budget: 120% used"`
     - 40 more
9. ✓ `locator.tap` `getByTestId("ds-open-sheet")` (1.4s, video 0:15) — `e2e/support/showcase.ts:38`
   - tap button "Show details" (1.4s)
   - screen: unchanged since step 8 at `com.budgetlens.offline / Design system`
10. ✓ `app.screenshot` `sheet` (793ms, video 0:17) — `e2e/design-system-overlays.e2e.ts:38`
   - [screenshot](attempt-1/screenshots/001-sheet.png) `.e2e/ios/results/design-system-overlays-opens-the-sheet-and-closes-it-e3fa527375e7e0db/attempt-1/screenshots/001-sheet.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-sheet.png) `.e2e/ios/results/design-system-overlays-opens-the-sheet-and-closes-it-e3fa527375e7e0db/attempt-1/screenshots/001-sheet.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-overlays-opens-the-sheet-and-closes-it-e3fa527375e7e0db/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a60-4611-79ab-9b58-ab346949ac12` · the whole run is in `report.json`</sub>
