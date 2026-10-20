# ✓ shows grouped transaction rows and toggles the paid state

`e2e/design-system-list.e2e.ts` · target `android` · passed · 7.1s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.7s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s) — `e2e/support/showcase.ts:53`
   - expect passed after 10 reads in 1.6s: no node (0 matches) x9 -&gt; at 1643ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (263ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (203ms) — `e2e/support/showcase.ts:57`
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-list")` (117ms) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `expect.toBeVisible` `getByTestId("ds-list-expenses")` (117ms) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `expect.toBeVisible` `getByTestId("ds-list-income")` (69ms) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 6 at `com.budgetlens.offline`
8. ✓ `expect.toBeVisible` `getByTestId("ds-row-salary")` (75ms) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (17ms) — `e2e/design-system-list.e2e.ts:15`
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `expect.toBeChecked` `getByTestId("ds-row-internet")` (17ms) — `e2e/design-system-list.e2e.ts:16`
   - screen: unchanged since step 9 at `com.budgetlens.offline`
11. ✓ `locator.tap` `getByTestId("ds-row-rent")` (132ms) — `e2e/design-system-list.e2e.ts:19`
   - tap group "ds-row-rent" (132ms)
   - screen: unchanged since step 10 at `com.budgetlens.offline`
12. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (1.4s) — `e2e/design-system-list.e2e.ts:22`
   - screen: 2 changes since step 11 at `com.budgetlens.offline`, 43 nodes
     - `added group testid="ds-row-rent" [checked]`
     - `removed group testid="ds-row-rent"`
13. ✓ `app.screenshot` `list` (1.4s) — `e2e/design-system-list.e2e.ts:24`
   - [screenshot](attempt-1/screenshots/001-list.png) `.e2e/android/results/design-system-list-shows-grouped-transaction-rows-d63b1f3243db92b7/attempt-1/screenshots/001-list.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list.png) `.e2e/android/results/design-system-list-shows-grouped-transaction-rows-d63b1f3243db92b7/attempt-1/screenshots/001-list.png`

<sub>e2e 0.21.2 · run `01a159b1-8fe8-7e30-9ff1-8be53825706b` · the whole run is in `report.json`</sub>
