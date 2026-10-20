# ✓ opens the sheet and closes it with its button

`e2e/design-system-overlays.e2e.ts` · target `ios` · passed · 23.4s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.3s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 7 reads in 2.3s: no node (0 matches) x6 -&gt; at 2276ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (766ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (766ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (800ms, video 0:05) — `e2e/support/showcase.ts:38`
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-overlay-result")` (3.3s, video 0:07) — `e2e/design-system-overlays.e2e.ts:17`
   - screen: 60 changes since step 4 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added other "Eating out" testid="ds-progress-over" value="Over budget: 120% used"`
     - `added text "Over budget: 120% used" testid="ds-progress-over-status"`
     - `added text "Over budget: 120% used"`
     - `added other testid="ds-section-inputs"`
     - `added text "INPUTS"`
     - `added text "INPUTS"`
     - `added textbox "Name" testid="ds-text-field" value="e.g. Rent"`
     - 48 more
6. ✓ `locator.tap` `getByTestId("ds-open-sheet")` (1.5s, video 0:10) — `e2e/support/showcase.ts:38`
   - tap button "Show details" (1.5s)
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
8. ✓ `expect.toHaveCount` `getByTestId("ds-sheet")` (533ms, video 0:14) — `e2e/design-system-overlays.e2e.ts:35`
   - expect passed after 2 reads in 533ms: count 1 (1 match) -&gt; at 533ms count 0 (0 matches)
   - screen: 52 changes since step 7 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added scroll-view`
     - `added other testid="ds-section-components"`
     - `added other "Eating out" testid="ds-progress-over" value="Over budget: 120% used"`
     - `added text "Over budget: 120% used" testid="ds-progress-over-status"`
     - `added text "Over budget: 120% used"`
     - `added other testid="ds-section-inputs"`
     - `added text "INPUTS"`
     - `added text "INPUTS"`
     - 40 more
9. ✓ `locator.tap` `getByTestId("ds-open-sheet")` (1.4s, video 0:15) — `e2e/support/showcase.ts:38`
   - tap button "Show details" (1.4s)
   - screen: unchanged since step 8 at `com.budgetlens.offline / Design system`
10. ✓ `app.screenshot` `sheet` (748ms, video 0:17) — `e2e/design-system-overlays.e2e.ts:38`
   - [screenshot](attempt-1/screenshots/001-sheet.png) `.e2e/ios/results/design-system-overlays-opens-the-sheet-and-closes-it-e3fa527375e7e0db/attempt-1/screenshots/001-sheet.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-sheet.png) `.e2e/ios/results/design-system-overlays-opens-the-sheet-and-closes-it-e3fa527375e7e0db/attempt-1/screenshots/001-sheet.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-overlays-opens-the-sheet-and-closes-it-e3fa527375e7e0db/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a83-1563-7d9f-9b7f-3444075e9392` · the whole run is in `report.json`</sub>
