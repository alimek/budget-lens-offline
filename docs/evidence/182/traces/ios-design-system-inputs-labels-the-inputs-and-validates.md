# ✓ labels the inputs and validates the amount field

`e2e/design-system-inputs.e2e.ts` · target `ios` · passed · 29.4s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.8s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.2s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 2 reads in 1.2s: no node (0 matches) -&gt; at 1197ms default states (1 match)
   - screen: 28 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (804ms, video 0:02) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (804ms)
   - screen: 1 change since step 2 at `com.budgetlens.offline / Overview`, 29 nodes
     - `added button "Savings" testid="overview-open-savings"`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (787ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (787ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (2.1s, video 0:05) — `e2e/design-system-inputs.e2e.ts:17`
   - screen: 62 changes since step 4 at `com.budgetlens.offline / Design system`, 48 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added other testid="ds-card"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added text "PLN 3,895.67" text="PLN 3,895.67" testid="ds-amount-total"`
     - `added text "PLN 3,895.67" text="PLN 3,895.67"`
     - `added button "Add item" testid="ds-primary-button"`
     - `added button "Close month" testid="ds-secondary-button"`
     - 50 more
6. ✓ `expect.toBeVisible` `getByTestId("ds-text-field")` (203ms, video 0:07) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field")` (203ms, video 0:08) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 6 at `com.budgetlens.offline / Design system`
8. ✓ `expect.toBeVisible` `getByTestId("ds-secure-field")` (198ms, video 0:08) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 7 at `com.budgetlens.offline / Design system`
9. ✓ `expect.toBeVisible` `getByTestId("ds-picker")` (202ms, video 0:08) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 8 at `com.budgetlens.offline / Design system`
10. ✓ `expect.toBeVisible` `getByTestId("ds-date-picker")` (208ms, video 0:08) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-text-field")` (205ms, video 0:08) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 10 at `com.budgetlens.offline / Design system`
12. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-amount-field")` (199ms, video 0:09) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 11 at `com.budgetlens.offline / Design system`
13. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-secure-field")` (200ms, video 0:09) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 12 at `com.budgetlens.offline / Design system`
14. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-picker")` (202ms, video 0:09) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 13 at `com.budgetlens.offline / Design system`
15. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-date-picker")` (201ms, video 0:09) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 14 at `com.budgetlens.offline / Design system`
16. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field-error")` (204ms, video 0:09) — `e2e/design-system-inputs.e2e.ts:26`
   - screen: unchanged since step 15 at `com.budgetlens.offline / Design system`
17. ✓ `locator.fill` `getByTestId("ds-amount-field")` (6.0s, video 0:10) — `e2e/design-system-inputs.e2e.ts:29`
   - fill textbox "Amount" (6.0s)
   - screen: unchanged since step 16 at `com.budgetlens.offline / Design system`
18. ✓ `expect.toHaveCount` `getByTestId("ds-amount-field-error")` (272ms, video 0:16) — `e2e/design-system-inputs.e2e.ts:30`
   - screen: 4 changes since step 17 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added textbox "Amount" testid="ds-amount-field" value="12,34"`
     - `removed textbox "Amount" testid="ds-amount-field" value="12,345"`
     - `removed text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `removed text "Use at most 2 decimal places"`
19. ✓ `locator.fill` `getByTestId("ds-amount-field")` (5.9s, video 0:16) — `e2e/design-system-inputs.e2e.ts:31`
   - fill textbox "Amount" (5.9s)
   - screen: 16 changes since step 18 at `com.budgetlens.offline / Design system`, 62 nodes
     - `added other testid="inputView"`
     - `added keyboard`
     - `added other testid="UIKeyboardLayoutStar Preview"`
     - `added key "1"`
     - `added key "2"`
     - `added key "3"`
     - `added key "4"`
     - `added key "5"`
     - `added key "6"`
     - `added key "7"`
     - `added key "8"`
     - `added key "9"`
     - 4 more
20. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field-error")` (261ms, video 0:22) — `e2e/design-system-inputs.e2e.ts:32`
   - screen: 20 changes since step 19 at `com.budgetlens.offline / Design system`, 48 nodes
     - `added textbox "Amount" testid="ds-amount-field" value="12,345"`
     - `added text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `added text "Use at most 2 decimal places"`
     - `removed textbox "Amount" testid="ds-amount-field" value="12,34"`
     - `removed other testid="inputView"`
     - `removed keyboard`
     - `removed other testid="UIKeyboardLayoutStar Preview"`
     - `removed key "1"`
     - `removed key "2"`
     - `removed key "3"`
     - `removed key "4"`
     - `removed key "5"`
     - 8 more
21. ✓ `app.screenshot` `inputs-error` (793ms, video 0:22) — `e2e/design-system-inputs.e2e.ts:34`
   - [screenshot](attempt-1/screenshots/001-inputs-error.png) `.e2e/ios/results/design-system-inputs-labels-the-inputs-and-validates-95fe189a55752c75/attempt-1/screenshots/001-inputs-error.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-inputs-error.png) `.e2e/ios/results/design-system-inputs-labels-the-inputs-and-validates-95fe189a55752c75/attempt-1/screenshots/001-inputs-error.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-inputs-labels-the-inputs-and-validates-95fe189a55752c75/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159ae-376c-74dc-92a5-24dd27d45bc0` · the whole run is in `report.json`</sub>
