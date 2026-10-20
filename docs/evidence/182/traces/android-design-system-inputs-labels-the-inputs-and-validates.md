# ✓ labels the inputs and validates the amount field

`e2e/design-system-inputs.e2e.ts` · target `android` · passed · 10.8s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.7s) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.5s) — `e2e/support/showcase.ts:10`
   - expect passed after 7 reads in 1.5s: no node (0 matches) x6 -&gt; at 1490ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (300ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (300ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (499ms) — `e2e/support/showcase.ts:38`
   - tap button (499ms)
   - screen: 18 changes since step 3 at `com.budgetlens.offline`, 51 nodes
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (1.2s) — `e2e/design-system-inputs.e2e.ts:17`
   - screen: 63 changes since step 4 at `com.budgetlens.offline`, 74 nodes
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
     - 51 more
6. ✓ `expect.toBeVisible` `getByTestId("ds-text-field")` (49ms) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field")` (55ms) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 6 at `com.budgetlens.offline`
8. ✓ `expect.toBeVisible` `getByTestId("ds-secure-field")` (47ms) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toBeVisible` `getByTestId("ds-picker")` (52ms) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `expect.toBeVisible` `getByTestId("ds-date-picker")` (47ms) — `e2e/design-system-inputs.e2e.ts:18`
   - screen: unchanged since step 9 at `com.budgetlens.offline`
11. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-date-picker")` (46ms) — `e2e/design-system-inputs.e2e.ts:23`
   - screen: unchanged since step 10 at `com.budgetlens.offline`
12. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field-error")` (52ms) — `e2e/design-system-inputs.e2e.ts:26`
   - screen: unchanged since step 11 at `com.budgetlens.offline`
13. ✓ `locator.fill` `getByTestId("ds-amount-field")` (634ms) — `e2e/design-system-inputs.e2e.ts:29`
   - fill textbox "12,345" (634ms)
   - screen: unchanged since step 12 at `com.budgetlens.offline`
14. ✓ `expect.toHaveCount` `getByTestId("ds-amount-field-error")` (43ms) — `e2e/design-system-inputs.e2e.ts:30`
   - screen: 4 changes since step 13 at `com.budgetlens.offline`, 74 nodes
     - `added textbox "12,34" testid="ds-amount-field" value="12,34"`
     - `added text "−12 345,67 zł" text="−12 345,67 zł" testid="ds-amount-negative"`
     - `removed textbox "12,345" testid="ds-amount-field" value="12,345"`
     - `removed text "Use at most 2 decimal places" testid="ds-amount-field-error"`
15. ✓ `locator.fill` `getByTestId("ds-amount-field")` (1.1s) — `e2e/design-system-inputs.e2e.ts:31`
   - fill textbox "12,34" (1.1s)
   - screen: unchanged since step 14 at `com.budgetlens.offline`
16. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field-error")` (46ms) — `e2e/design-system-inputs.e2e.ts:32`
   - screen: 4 changes since step 15 at `com.budgetlens.offline`, 74 nodes
     - `added textbox "12,345" testid="ds-amount-field" value="12,345"`
     - `added text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `removed textbox "12,34" testid="ds-amount-field" value="12,34"`
     - `removed text "−12 345,67 zł" text="−12 345,67 zł" testid="ds-amount-negative"`
17. ✓ `app.screenshot` `inputs-error` (1.4s) — `e2e/design-system-inputs.e2e.ts:34`
   - [screenshot](attempt-1/screenshots/001-inputs-error.png) `.e2e/android/results/design-system-inputs-labels-the-inputs-and-validates-a7ea268f02015768/attempt-1/screenshots/001-inputs-error.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-inputs-error.png) `.e2e/android/results/design-system-inputs-labels-the-inputs-and-validates-a7ea268f02015768/attempt-1/screenshots/001-inputs-error.png`

<sub>e2e 0.21.2 · run `01a159c9-cc37-7f6c-a432-4039abd51cf8` · the whole run is in `report.json`</sub>
