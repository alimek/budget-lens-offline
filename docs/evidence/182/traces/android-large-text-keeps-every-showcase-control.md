# ✓ keeps every showcase control reachable at 200% text size

`e2e/large-text.e2e.ts` · target `android` · passed · 9.7s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.5s) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.3s) — `e2e/support/showcase.ts:10`
   - expect passed after 8 reads in 1.3s: no node (0 matches) x7 -&gt; at 1257ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (340ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (340ms)
   - screen: 24 changes since step 2 at `com.budgetlens.offline`, 53 nodes
     - `added group`
     - `added group`
     - `added group`
     - `added group`
     - `added group testid="overview-open-savings"`
     - `added text "Savings"`
     - `added button`
     - `added group`
     - `added group`
     - `added tab "Overview" testid="tab-overview" [selected]`
     - `added image testid="com.budgetlens.offline:id/navigation_bar_item_icon_view" [selected]`
     - `added text "Overview" testid="com.budgetlens.offline:id/navigation_bar_item_large_label_view" [selected]`
     - 12 more
4. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (603ms) — `e2e/support/showcase.ts:38`
   - tap button (603ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-primary-button")` (81ms) — `e2e/large-text.e2e.ts:39`
   - screen: 58 changes since step 4 at `com.budgetlens.offline`, 69 nodes
     - `added button "Navigate up"`
     - `added text "Design system"`
     - `added group testid="screen-design-system"`
     - `added group testid="ds-section-components"`
     - `added heading "Components"`
     - `added group testid="ds-card"`
     - `added heading "October 2026"`
     - `added text "Opening balance, income and expenses"`
     - `added group testid="ds-badge"`
     - `added text "Changed this month"`
     - `added text "Income"`
     - `added text "+PLN 12,345.67" text="+PLN 12,345.67" testid="ds-amount-income"`
     - 46 more
6. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (53ms) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `screen.scrollUntilVisible` `getByTestId("ds-text-field")` (1.2s) — `e2e/large-text.e2e.ts:39`
   - screen: 35 changes since step 6 at `com.budgetlens.offline`, 80 nodes
     - `added progressbar "Eating out, Over budget: 120% used" testid="ds-progress-over"`
     - `added text "Eating out"`
     - `added group`
     - `added progressbar`
     - `added text "Over budget: 120% used" testid="ds-progress-over-status"`
     - `added group testid="ds-section-inputs"`
     - `added heading "Inputs"`
     - `added group`
     - `added group`
     - `added group`
     - `added textbox testid="ds-text-field"`
     - `added text "Name"`
     - 23 more
8. ✓ `expect.toBeVisible` `getByTestId("ds-text-field")` (46ms) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `screen.scrollUntilVisible` `getByTestId("ds-amount-field")` (51ms) — `e2e/large-text.e2e.ts:39`
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-field")` (52ms) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 9 at `com.budgetlens.offline`
11. ✓ `screen.scrollUntilVisible` `getByTestId("ds-picker")` (1.2s) — `e2e/large-text.e2e.ts:39`
   - screen: 47 changes since step 10 at `com.budgetlens.offline`, 63 nodes
     - `added textbox "Every month" testid="ds-picker" value="Every month"`
     - `added text "Repeats"`
     - `added combobox`
     - `added button "Due date, Oct 10, 2026" testid="ds-date-picker"`
     - `added textbox "Oct 10, 2026" value="Oct 10, 2026" [disabled]`
     - `added text "Due date"`
     - `added group testid="ds-section-lists"`
     - `added heading "Lists"`
     - `added group testid="ds-open-list"`
     - `added text "Open list example"`
     - `added group testid="ds-section-amounts"`
     - `added heading "Amounts"`
     - 35 more
12. ✓ `expect.toBeVisible` `getByTestId("ds-picker")` (43ms) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 11 at `com.budgetlens.offline`
13. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (48ms) — `e2e/large-text.e2e.ts:39`
   - screen: unchanged since step 12 at `com.budgetlens.offline`
14. ✓ `expect.toBeVisible` `getByTestId("ds-date-picker")` (51ms) — `e2e/large-text.e2e.ts:40`
   - screen: unchanged since step 13 at `com.budgetlens.offline`
15. ✓ `app.screenshot` `large-text-inputs` (1.4s) — `e2e/large-text.e2e.ts:42`
   - [screenshot](attempt-1/screenshots/001-large-text-inputs.png) `.e2e/android-large-text/results/large-text-keeps-every-showcase-control-f610eda3af32fd60/attempt-1/screenshots/001-large-text-inputs.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-inputs.png) `.e2e/android-large-text/results/large-text-keeps-every-showcase-control-f610eda3af32fd60/attempt-1/screenshots/001-large-text-inputs.png`

<sub>e2e 0.21.2 · run `01a159cf-37cc-74cc-94fc-c6300a7f999f` · the whole run is in `report.json`</sub>
