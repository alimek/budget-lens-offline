# ✓ opens the native calendar from the date picker

`e2e/design-system-inputs.e2e.ts` · target `android` · passed · 9.0s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.7s) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.5s) — `e2e/support/showcase.ts:10`
   - expect passed after 7 reads in 1.5s: no node (0 matches) x6 -&gt; at 1545ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (257ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (257ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (604ms) — `e2e/support/showcase.ts:38`
   - tap button (604ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (1.2s) — `e2e/design-system-inputs.e2e.ts:60`
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
6. ✓ `locator.tap` `getByTestId("ds-date-picker")` (134ms) — `e2e/design-system-inputs.e2e.ts:63`
   - tap button "Due date, Oct 10, 2026" (134ms)
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `expect.toBeVisible` `getByText("October 2026")` (385ms) — `e2e/design-system-inputs.e2e.ts:72`
   - expect passed after 2 reads in 385ms: no node (0 matches) -&gt; at 385ms default states (1 match)
   - screen: 134 changes since step 6 at `com.budgetlens.offline`, 106 nodes
     - `added text "Select date"`
     - `added text "Current selection: Saturday, October 10, 2026" text="Oct 10, 2026"`
     - `added group "Switch to text input mode"`
     - `added text "October 2026"`
     - `added group "Activate to change the year"`
     - `added button`
     - `added group "Change to previous month"`
     - `added button`
     - `added group "Change to next month"`
     - `added button`
     - `added group "Sunday"`
     - `added group "Monday"`
     - 122 more
8. ✓ `app.screenshot` `date-picker` (1.3s) — `e2e/design-system-inputs.e2e.ts:73`
   - [screenshot](attempt-1/screenshots/001-date-picker.png) `.e2e/android/results/design-system-inputs-opens-the-native-calendar-from-7255a2c1bd88b978/attempt-1/screenshots/001-date-picker.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-date-picker.png) `.e2e/android/results/design-system-inputs-opens-the-native-calendar-from-7255a2c1bd88b978/attempt-1/screenshots/001-date-picker.png`

<sub>e2e 0.21.2 · run `01a159c9-cc37-7f6c-a432-4039abd51cf8` · the whole run is in `report.json`</sub>
