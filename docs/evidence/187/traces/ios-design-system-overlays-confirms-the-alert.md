# ✓ confirms the alert

`e2e/design-system-overlays.e2e.ts` · target `ios` · passed · 23.3s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.2s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 5 reads in 2.2s: no node (0 matches) x4 -&gt; at 2171ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (786ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (786ms)
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
   - screen: 62 changes since step 4 at `com.budgetlens.offline / Design system`, 48 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-inputs"`
     - `added textbox "Name" testid="ds-text-field" value="e.g. Rent"`
     - `added textbox "Amount" testid="ds-amount-field" value="12,345"`
     - `added text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `added text "Use at most 2 decimal places"`
     - `added textbox "Recovery secret" testid="ds-secure-field" value=<secure> purpose=password [secure]`
     - `added button "Repeats, Every month" testid="ds-picker"`
     - `added text "Every month"`
     - 50 more
6. ✓ `locator.tap` `getByTestId("ds-open-alert")` (1.6s, video 0:10) — `e2e/support/showcase.ts:38`
   - tap button "Close month" (1.6s)
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `app.screenshot` `alert` (1.9s, video 0:13) — `e2e/design-system-overlays.e2e.ts:49`
   - [screenshot](attempt-1/screenshots/001-alert.png) `.e2e/ios/results/design-system-overlays-confirms-the-alert-260f2b1146be7a36/attempt-1/screenshots/001-alert.png`
8. ✓ `locator.tap` `getByRole("group", name: "Close October?") >> getByRole("button").last()` (1.5s, video 0:15) — `e2e/design-system-overlays.e2e.ts:52`
   - tap button "Close month" (1.5s)
   - screen: 15 changes since step 6 at `com.budgetlens.offline / Design system`, 63 nodes
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
9. ✓ `expect.toHaveCount` `getByRole("group", name: "Close October?")` (218ms, video 0:16) — `e2e/design-system-overlays.e2e.ts:55`
   - screen: 15 changes since step 8 at `com.budgetlens.offline / Design system`, 48 nodes
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
10. ✓ `expect.not.toHaveText` `getByTestId("ds-overlay-result")` (1.2s, video 0:16) — `e2e/design-system-overlays.e2e.ts:56`
   - expect passed after 4 reads in 1.2s
   - screen: 4 changes since step 9 at `com.budgetlens.offline / Design system`, 48 nodes
     - `added text "Last action: Month closed" testid="ds-overlay-result"`
     - `added text "Last action: Month closed"`
     - `removed text "Last action: none" testid="ds-overlay-result"`
     - `removed text "Last action: none"`

## Evidence

- [screenshot](attempt-1/screenshots/001-alert.png) `.e2e/ios/results/design-system-overlays-confirms-the-alert-260f2b1146be7a36/attempt-1/screenshots/001-alert.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-overlays-confirms-the-alert-260f2b1146be7a36/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a83-1563-7d9f-9b7f-3444075e9392` · the whole run is in `report.json`</sub>
