# ✓ adds a row with the add button

`e2e/design-system-list.e2e.ts` · target `android` · passed · 5.8s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.8s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s) — `e2e/support/showcase.ts:53`
   - expect passed after 7 reads in 1.6s: no node (0 matches) x6 -&gt; at 1586ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (344ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (158ms) — `e2e/support/showcase.ts:57`
   - screen: 52 changes since step 2 at `com.budgetlens.offline`, 43 nodes
     - `added button "Navigate up"`
     - `added text "List example"`
     - `added group testid="screen-design-system-list"`
     - `added group testid="ds-list"`
     - `added text "Expenses" testid="ds-list-expenses"`
     - `added group testid="ds-row-rent"`
     - `added text "Rent"`
     - `added text "Due Oct 10, 2026"`
     - `added text "−PLN 2,000.00" text="−PLN 2,000.00"`
     - `added checkbox`
     - `added group testid="ds-row-internet" [checked]`
     - `added text "Internet"`
     - 40 more
5. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-add-button")` (212ms) — `e2e/design-system-list.e2e.ts:32`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `locator.tap` `getByTestId("ds-add-button")` (261ms) — `e2e/support/showcase.ts:38`
   - tap button "Add item" (261ms)
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `app.screenshot` `list-added` (1.3s) — `e2e/design-system-list.e2e.ts:36`
   - [screenshot](attempt-1/screenshots/001-list-added.png) `.e2e/android/results/design-system-list-adds-a-row-with-the-add-button-9aa106723791ba3e/attempt-1/screenshots/001-list-added.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-added.png) `.e2e/android/results/design-system-list-adds-a-row-with-the-add-button-9aa106723791ba3e/attempt-1/screenshots/001-list-added.png`

<sub>e2e 0.21.2 · run `01a159b1-8fe8-7e30-9ff1-8be53825706b` · the whole run is in `report.json`</sub>
