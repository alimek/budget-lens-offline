# ✓ keeps every showcase control reachable at 200% text size

`e2e/large-text.e2e.ts` · target `ios` · passed · 21.7s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s, video 0:01) — `e2e/support/showcase.ts:10`
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (780ms, video 0:03) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (780ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (798ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (798ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-primary-button")` (3.7s, video 0:06) — `e2e/large-text.e2e.ts:39`
   - screen: 49 changes since step 4 at `com.budgetlens.offline / Design system`, 35 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added other testid="ds-card"`
     - `added text "+PLN 12,345.67" text="+PLN 12,345.67" testid="ds-amount-income"`
     - `added text "+PLN 12,345.67" text="+PLN 12,345.67"`
     - `added text "Expenses"`
     - `added text "Expenses"`
     - `added text "−PLN 8,450.00" text="−PLN 8,450.00" testid="ds-amount-expense"`
     - `added text "−PLN 8,450.00" text="−PLN 8,450.00"`
     - 37 more
6. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (207ms, video 0:10) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `screen.scrollUntilVisible` `getByTestId("ds-text-field")` (1.9s, video 0:10) — `e2e/large-text.e2e.ts:39`
   - screen: 19 changes since step 6 at `com.budgetlens.offline / Design system`, 34 nodes
     - `added other "Eating out" testid="ds-progress-over" value="Over budget: 120% used"`
     - `added text "Over budget: 120% used" testid="ds-progress-over-status"`
     - `added text "Over budget: 120% used"`
     - `added other testid="ds-section-inputs"`
     - `added text "INPUTS"`
     - `added text "INPUTS"`
     - `added textbox "Name" testid="ds-text-field" value="e.g. Rent"`
     - `added other "Vertical scroll bar, 11 pages" value="16%"`
     - `added other "Vertical scroll bar, 11 pages" value="16%"`
     - `removed text "+PLN 12,345.67" text="+PLN 12,345.67" testid="ds-amount-income"`
     - `removed text "+PLN 12,345.67" text="+PLN 12,345.67"`
     - `removed text "Expenses"`
     - 7 more
8. ✓ `expect.toBeVisible` `getByTestId("ds-text-field")` (209ms, video 0:12) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 7 at `com.budgetlens.offline / Design system`
9. ✓ `screen.scrollUntilVisible` `getByTestId("ds-amount-field")` (1.9s, video 0:12) — `e2e/large-text.e2e.ts:39`
   - screen: 16 changes since step 8 at `com.budgetlens.offline / Design system`, 30 nodes
     - `added textbox "Amount" testid="ds-amount-field" value="12,345"`
     - `added text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `added text "Use at most 2 decimal places"`
     - `added textbox "Recovery secret" testid="ds-secure-field" value=<secure> purpose=password [secure]`
     - `added other "Vertical scroll bar, 11 pages" value="21%"`
     - `added other "Vertical scroll bar, 11 pages" value="21%"`
     - `removed other testid="ds-card"`
     - `removed text "PLN 3,895.67" text="PLN 3,895.67" testid="ds-amount-total"`
     - `removed text "PLN 3,895.67" text="PLN 3,895.67"`
     - `removed button "Add item" testid="ds-primary-button"`
     - `removed button "Close month" testid="ds-secondary-button"`
     - `removed switch "Privacy mode" testid="ds-toggle" value="0"`
     - 4 more
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field")` (213ms, video 0:14) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `screen.scrollUntilVisible` `getByTestId("ds-picker")` (1.8s, video 0:14) — `e2e/large-text.e2e.ts:39`
   - screen: 22 changes since step 10 at `com.budgetlens.offline / Design system`, 28 nodes
     - `added button "Repeats, Every month" testid="ds-picker"`
     - `added text "Every month"`
     - `added date-picker "Due date, Due date" testid="ds-date-picker"`
     - `added button "Date Picker" value="10 Oct 2026"`
     - `added other testid="ds-section-lists"`
     - `added text "LISTS"`
     - `added text "LISTS"`
     - `added button "Open list example" testid="ds-open-list"`
     - `added other "Vertical scroll bar, 11 pages" value="27%"`
     - `added other "Vertical scroll bar, 11 pages" value="27%"`
     - `removed other testid="ds-section-components"`
     - `removed tablist testid="ds-segmented"`
     - 10 more
12. ✓ `expect.toBeVisible` `getByTestId("ds-picker")` (206ms, video 0:16) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 11 at `com.budgetlens.offline / Design system`
13. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (205ms, video 0:16) — `e2e/large-text.e2e.ts:39`
   - screen: unchanged since step 12 at `com.budgetlens.offline / Design system`
14. ✓ `expect.toBeVisible` `getByTestId("ds-date-picker")` (206ms, video 0:16) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 13 at `com.budgetlens.offline / Design system`
15. ✓ `app.screenshot` `large-text-inputs` (746ms, video 0:16) — `e2e/large-text.e2e.ts:42`
   - [screenshot](attempt-1/screenshots/001-large-text-inputs.png) `.e2e/ios-large-text/results/large-text-keeps-every-showcase-control-f8fe9805bf877210/attempt-1/screenshots/001-large-text-inputs.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-inputs.png) `.e2e/ios-large-text/results/large-text-keeps-every-showcase-control-f8fe9805bf877210/attempt-1/screenshots/001-large-text-inputs.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios-large-text/results/large-text-keeps-every-showcase-control-f8fe9805bf877210/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159b3-8c83-7bfe-a159-d66fab62e9e2` · the whole run is in `report.json`</sub>
