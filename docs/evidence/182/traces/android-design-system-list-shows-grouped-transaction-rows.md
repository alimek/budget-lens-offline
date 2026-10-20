# ✓ shows grouped transaction rows and toggles the paid state

`e2e/design-system-list.e2e.ts` · target `android` · passed · 7.0s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.7s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.5s) — `e2e/support/showcase.ts:53`
   - expect passed after 9 reads in 1.5s: no node (0 matches) x8 -&gt; at 1468ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (204ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (394ms) — `e2e/support/showcase.ts:57`
   - screen: 55 changes since step 2 at `com.budgetlens.offline`, 46 nodes
     - `added button "Navigate up"`
     - `added text "List example"`
     - `added group testid="screen-design-system-list"`
     - `added group testid="ds-list"`
     - `added text "Expenses" testid="ds-list-expenses"`
     - `added group testid="ds-row-rent"`
     - `added group "Paid: Rent"`
     - `added text "Rent"`
     - `added text "Due Oct 10, 2026"`
     - `added text "−PLN 2,000.00" text="−PLN 2,000.00"`
     - `added checkbox`
     - `added group testid="ds-row-internet" [checked]`
     - 43 more
5. ✓ `expect.toBeVisible` `getByTestId("ds-list")` (172ms) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `expect.toBeVisible` `getByTestId("ds-list-expenses")` (32ms) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `expect.toBeVisible` `getByTestId("ds-list-income")` (19ms) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 6 at `com.budgetlens.offline`
8. ✓ `expect.toBeVisible` `getByTestId("ds-row-salary")` (19ms) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent") >> getByRole("group")` (18ms) — `e2e/design-system-list.e2e.ts:15`
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (19ms) — `e2e/design-system-list.e2e.ts:16`
   - screen: unchanged since step 9 at `com.budgetlens.offline`
11. ✓ `expect.toBeChecked` `getByTestId("ds-row-internet")` (19ms) — `e2e/design-system-list.e2e.ts:17`
   - screen: unchanged since step 10 at `com.budgetlens.offline`
12. ✓ `locator.tap` `getByTestId("ds-row-rent")` (118ms) — `e2e/design-system-list.e2e.ts:20`
   - tap group "ds-row-rent" (118ms)
   - screen: unchanged since step 11 at `com.budgetlens.offline`
13. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (1.4s) — `e2e/design-system-list.e2e.ts:23`
   - screen: 2 changes since step 12 at `com.budgetlens.offline`, 46 nodes
     - `added group testid="ds-row-rent" [checked]`
     - `removed group testid="ds-row-rent"`
14. ✓ `app.screenshot` `list` (1.4s) — `e2e/design-system-list.e2e.ts:25`
   - [screenshot](attempt-1/screenshots/001-list.png) `.e2e/android/results/design-system-list-shows-grouped-transaction-rows-d63b1f3243db92b7/attempt-1/screenshots/001-list.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list.png) `.e2e/android/results/design-system-list-shows-grouped-transaction-rows-d63b1f3243db92b7/attempt-1/screenshots/001-list.png`

<sub>e2e 0.21.2 · run `01a159c9-cc37-7f6c-a432-4039abd51cf8` · the whole run is in `report.json`</sub>
