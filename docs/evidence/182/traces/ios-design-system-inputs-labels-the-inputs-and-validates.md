# ✓ labels the inputs and validates the amount field

`e2e/design-system-inputs.e2e.ts` · target `ios` · passed · 31.5s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s, video 0:01) — `e2e/support/showcase.ts:10`
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (792ms, video 0:03) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (792ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (804ms, video 0:04) — `e2e/support/showcase.ts:38`
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (3.3s, video 0:06) — `e2e/design-system-inputs.e2e.ts:17`
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
6. ✓ `expect.toBeVisible` `getByTestId("ds-text-field")` (207ms, video 0:09) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field")` (205ms, video 0:09) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 6 at `com.budgetlens.offline / Design system`
8. ✓ `expect.toBeVisible` `getByTestId("ds-secure-field")` (205ms, video 0:10) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 7 at `com.budgetlens.offline / Design system`
9. ✓ `expect.toBeVisible` `getByTestId("ds-picker")` (209ms, video 0:10) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 8 at `com.budgetlens.offline / Design system`
10. ✓ `expect.toBeVisible` `getByTestId("ds-date-picker")` (211ms, video 0:10) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-text-field")` (205ms, video 0:10) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 10 at `com.budgetlens.offline / Design system`
12. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-amount-field")` (203ms, video 0:10) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 11 at `com.budgetlens.offline / Design system`
13. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-secure-field")` (205ms, video 0:11) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 12 at `com.budgetlens.offline / Design system`
14. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-picker")` (206ms, video 0:11) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 13 at `com.budgetlens.offline / Design system`
15. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-date-picker")` (206ms, video 0:11) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 14 at `com.budgetlens.offline / Design system`
16. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field-error")` (209ms, video 0:11) — `e2e/design-system-inputs.e2e.ts:26`
   - screen: unchanged since step 15 at `com.budgetlens.offline / Design system`
17. ✓ `locator.fill` `getByTestId("ds-amount-field")` (6.0s, video 0:11) — `e2e/design-system-inputs.e2e.ts:29`
   - fill textbox "Amount" (6.0s)
   - screen: unchanged since step 16 at `com.budgetlens.offline / Design system`
18. ✓ `expect.toHaveCount` `getByTestId("ds-amount-field-error")` (271ms, video 0:17) — `e2e/design-system-inputs.e2e.ts:30`
   - screen: 4 changes since step 17 at `com.budgetlens.offline / Design system`, 44 nodes
     - `added textbox "Amount" testid="ds-amount-field" value="12,34"`
     - `removed textbox "Amount" testid="ds-amount-field" value="12,345"`
     - `removed text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `removed text "Use at most 2 decimal places"`
19. ✓ `locator.fill` `getByTestId("ds-amount-field")` (6.0s, video 0:18) — `e2e/design-system-inputs.e2e.ts:31`
   - fill textbox "Amount" (6.0s)
   - screen: 16 changes since step 18 at `com.budgetlens.offline / Design system`, 60 nodes
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
20. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field-error")` (268ms, video 0:24) — `e2e/design-system-inputs.e2e.ts:32`
   - screen: 20 changes since step 19 at `com.budgetlens.offline / Design system`, 46 nodes
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
21. ✓ `app.screenshot` `inputs-error` (869ms, video 0:24) — `e2e/design-system-inputs.e2e.ts:34`
   - [screenshot](attempt-1/screenshots/001-inputs-error.png) `.e2e/ios/results/design-system-inputs-labels-the-inputs-and-validates-95fe189a55752c75/attempt-1/screenshots/001-inputs-error.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-inputs-error.png) `.e2e/ios/results/design-system-inputs-labels-the-inputs-and-validates-95fe189a55752c75/attempt-1/screenshots/001-inputs-error.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-inputs-labels-the-inputs-and-validates-95fe189a55752c75/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159cb-b68f-7040-977a-1fa30cd7f30b` · the whole run is in `report.json`</sub>
