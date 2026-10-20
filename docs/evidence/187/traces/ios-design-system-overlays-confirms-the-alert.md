# ✓ confirms the alert

`e2e/design-system-overlays.e2e.ts` · target `ios` · passed · 24.0s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.3s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 6 reads in 2.3s: no node (0 matches) x5 -&gt; at 2297ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (769ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (769ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (804ms, video 0:05) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (804ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-overlay-result")` (4.8s, video 0:07) — `e2e/design-system-overlays.e2e.ts:17`
   - screen: 75 changes since step 4 at `com.budgetlens.offline / Design system`, 61 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-overlays"`
     - `added text "OVERLAYS"`
     - `added text "OVERLAYS"`
     - `added button "Show details" testid="ds-open-sheet"`
     - `added button "Close month" testid="ds-open-alert"`
     - `added pop-up-button "More actions" testid="ds-menu"`
     - `added button`
     - `added text "More actions"`
     - 63 more
6. ✓ `locator.tap` `getByTestId("ds-open-alert")` (1.4s, video 0:12) — `e2e/support/showcase.ts:38`
   - tap button "Close month" (1.4s)
   - screen: 4 changes since step 5 at `com.budgetlens.offline / Design system`, 61 nodes
     - `added other "Vertical scroll bar, 5 pages" value="42%"`
     - `added other "Vertical scroll bar, 5 pages" value="42%"`
     - `removed other "Vertical scroll bar, 5 pages" value="41%"`
     - `removed other "Vertical scroll bar, 5 pages" value="41%"`
7. ✓ `app.screenshot` `alert` (749ms, video 0:14) — `e2e/design-system-overlays.e2e.ts:49`
   - [screenshot](attempt-1/screenshots/001-alert.png) `.e2e/ios/results/design-system-overlays-confirms-the-alert-260f2b1146be7a36/attempt-1/screenshots/001-alert.png`
8. ✓ `locator.tap` `getByRole("group", name: "Close October?") >> getByRole("button").last()` (1.5s, video 0:15) — `e2e/design-system-overlays.e2e.ts:52`
   - tap button "Close month" (1.5s)
   - screen: 15 changes since step 6 at `com.budgetlens.offline / Design system`, 76 nodes
     - `added group "Close October?"`
     - `added scroll-view`
     - `added text "Close October?"`
     - `added text "Items and amounts of October can no longer be changed."`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
     - `added scroll-view`
     - `added button "Cancel"`
     - `added button "Close month"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - 3 more
9. ✓ `expect.toHaveCount` `getByRole("group", name: "Close October?")` (217ms, video 0:17) — `e2e/design-system-overlays.e2e.ts:55`
   - screen: 15 changes since step 8 at `com.budgetlens.offline / Design system`, 61 nodes
     - `removed scroll-view`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed group "Close October?"`
     - `removed scroll-view`
     - `removed text "Close October?"`
     - `removed text "Items and amounts of October can no longer be changed."`
     - `removed other "Vertical scroll bar, 1 page" value="0%"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed other "Vertical scroll bar, 1 page" value="0%"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed button "Cancel"`
     - 3 more
10. ✓ `expect.not.toHaveText` `getByTestId("ds-overlay-result")` (1.2s, video 0:17) — `e2e/design-system-overlays.e2e.ts:56`
   - expect passed after 4 reads in 1.2s
   - screen: 4 changes since step 9 at `com.budgetlens.offline / Design system`, 61 nodes
     - `added text "Last action: Month closed" testid="ds-overlay-result"`
     - `added text "Last action: Month closed"`
     - `removed text "Last action: none" testid="ds-overlay-result"`
     - `removed text "Last action: none"`

## Evidence

- [screenshot](attempt-1/screenshots/001-alert.png) `.e2e/ios/results/design-system-overlays-confirms-the-alert-260f2b1146be7a36/attempt-1/screenshots/001-alert.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-overlays-confirms-the-alert-260f2b1146be7a36/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a60-4611-79ab-9b58-ab346949ac12` · the whole run is in `report.json`</sub>
