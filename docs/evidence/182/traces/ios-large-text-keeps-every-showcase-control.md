# ✓ keeps every showcase control reachable at 200% text size

`e2e/large-text.e2e.ts` · target `ios` · passed · 21.1s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s, video 0:01) — `e2e/support/showcase.ts:10`
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (778ms, video 0:03) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (778ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (800ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (800ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-primary-button")` (2.1s, video 0:06) — `e2e/large-text.e2e.ts:39`
   - screen: 46 changes since step 4 at `com.budgetlens.offline / Design system`, 32 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added other testid="ds-card"`
     - `added text "Opening balance, income and expenses"`
     - `added text "Opening balance, income and expenses"`
     - `added other testid="ds-badge"`
     - `added text "Changed this month"`
     - `added text "Changed this month"`
     - `added text "Income"`
     - 34 more
6. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (208ms, video 0:08) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `screen.scrollUntilVisible` `getByTestId("ds-text-field")` (4.6s, video 0:08) — `e2e/large-text.e2e.ts:39`
   - screen: 43 changes since step 6 at `com.budgetlens.offline / Design system`, 33 nodes
     - `added button "Close month" testid="ds-secondary-button"`
     - `added switch "Privacy mode" testid="ds-toggle" value="0"`
     - `added text "Privacy mode"`
     - `added switch value="0"`
     - `added tablist testid="ds-segmented"`
     - `added tab "Only this month" [selected]`
     - `added tab "From this month"`
     - `added other "Groceries" testid="ds-progress" value="60% used"`
     - `added text "60% used" testid="ds-progress-status"`
     - `added text "60% used"`
     - `added other "Eating out" testid="ds-progress-over" value="Over budget: 120% used"`
     - `added text "Over budget: 120% used" testid="ds-progress-over-status"`
     - 31 more
8. ✓ `expect.toBeVisible` `getByTestId("ds-text-field")` (209ms, video 0:13) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 7 at `com.budgetlens.offline / Design system`
9. ✓ `screen.scrollUntilVisible` `getByTestId("ds-amount-field")` (211ms, video 0:13) — `e2e/large-text.e2e.ts:39`
   - screen: unchanged since step 8 at `com.budgetlens.offline / Design system`
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field")` (209ms, video 0:13) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `screen.scrollUntilVisible` `getByTestId("ds-picker")` (1.9s, video 0:13) — `e2e/large-text.e2e.ts:39`
   - screen: 25 changes since step 10 at `com.budgetlens.offline / Design system`, 28 nodes
     - `added textbox "Recovery secret" testid="ds-secure-field" value=<secure> purpose=password [secure]`
     - `added button "Repeats, Every month" testid="ds-picker"`
     - `added text "Every month"`
     - `added date-picker "Due date, Due date" testid="ds-date-picker"`
     - `added button "Date Picker" value="10 Oct 2026"`
     - `added other testid="ds-section-lists"`
     - `added text "LISTS"`
     - `added text "LISTS"`
     - `added other "Vertical scroll bar, 11 pages" value="26%"`
     - `added other "Vertical scroll bar, 11 pages" value="26%"`
     - `removed button "Close month" testid="ds-secondary-button"`
     - `removed switch "Privacy mode" testid="ds-toggle" value="0"`
     - 13 more
12. ✓ `expect.toBeVisible` `getByTestId("ds-picker")` (206ms, video 0:15) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 11 at `com.budgetlens.offline / Design system`
13. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (205ms, video 0:15) — `e2e/large-text.e2e.ts:39`
   - screen: unchanged since step 12 at `com.budgetlens.offline / Design system`
14. ✓ `expect.toBeVisible` `getByTestId("ds-date-picker")` (202ms, video 0:16) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 13 at `com.budgetlens.offline / Design system`
15. ✓ `app.screenshot` `large-text-inputs` (754ms, video 0:16) — `e2e/large-text.e2e.ts:42`
   - [screenshot](attempt-1/screenshots/001-large-text-inputs.png) `.e2e/ios-large-text/results/large-text-keeps-every-showcase-control-f8fe9805bf877210/attempt-1/screenshots/001-large-text-inputs.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-inputs.png) `.e2e/ios-large-text/results/large-text-keeps-every-showcase-control-f8fe9805bf877210/attempt-1/screenshots/001-large-text-inputs.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios-large-text/results/large-text-keeps-every-showcase-control-f8fe9805bf877210/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159cf-95f8-764e-b0ca-0e2c15a28d91` · the whole run is in `report.json`</sub>
