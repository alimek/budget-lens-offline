# ✓ adds a row with the add button

`e2e/design-system-list.e2e.ts` · target `android` · passed · 6.7s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.3s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.9s) — `e2e/support/showcase.ts:53`
   - expect passed after 15 reads in 2.9s: no node (0 matches) x14 -&gt; at 2862ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (219ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (518ms) — `e2e/support/showcase.ts:57`
   - screen: 91 changes since step 2 at `com.budgetlens.offline`, 101 nodes
     - `added button "Navigate up"`
     - `added text "List example"`
     - `added group testid="screen-design-system-list"`
     - `added group testid="ds-list"`
     - `added text "Expenses" testid="ds-list-expenses"`
     - `added checkbox "Paid: Rent" testid="ds-row-rent"`
     - `added text "Rent"`
     - `added text "Due Oct 10, 2026"`
     - `added text "−PLN 2,000.00" text="−PLN 2,000.00"`
     - `added group testid="ds-row-rent-edit"`
     - `added group "Edit: Rent"`
     - `added text "Edit"`
     - 79 more
5. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-add-button")` (188ms) — `e2e/design-system-list.e2e.ts:39`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `locator.tap` `getByTestId("ds-add-button")` (188ms) — `e2e/support/showcase.ts:38`
   - tap button "Add item" (188ms)
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `app.screenshot` `list-added` (1.3s) — `e2e/design-system-list.e2e.ts:43`
   - [screenshot](attempt-1/screenshots/001-list-added.png) `.e2e/android/results/design-system-list-adds-a-row-with-the-add-button-9aa106723791ba3e/attempt-1/screenshots/001-list-added.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-added.png) `.e2e/android/results/design-system-list-adds-a-row-with-the-add-button-9aa106723791ba3e/attempt-1/screenshots/001-list-added.png`

<sub>e2e 0.21.2 · run `01a15ab8-f008-795c-8299-cba8bdc69ae0` · the whole run is in `report.json`</sub>
