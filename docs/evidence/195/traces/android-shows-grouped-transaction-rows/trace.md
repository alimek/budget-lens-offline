# ✓ shows grouped transaction rows and toggles the paid state

`e2e/design-system-list.e2e.ts` · target `android` · passed · 8.0s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.3s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.5s) — `e2e/support/showcase.ts:53`
   - expect passed after 14 reads in 2.5s: no node (0 matches) x13 -&gt; at 2506ms default states (1 match)
   - screen: 45 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (278ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (671ms) — `e2e/support/showcase.ts:57`
   - expect passed after 2 reads in 671ms: no node (0 matches) -&gt; at 671ms default states (1 match)
   - screen: 92 changes since step 2 at `com.budgetlens.offline`, 101 nodes
     - `added button "Navigate up"`
     - `added text "List example"`
     - `added group testid="screen-design-system-list"`
     - `added group testid="ds-list"`
     - `added text "Expenses" testid="ds-list-expenses"`
     - `added checkbox "Paid: Rent" testid="ds-row-rent"`
     - `added text "Rent"`
     - `added text "Due Oct 10, 2026"`
     - `added text "−PLN 2,000.00" text="−PLN 2,000.00"`
     - `added group`
     - `added group testid="ds-row-rent-edit"`
     - `added group "Edit: Rent"`
     - 80 more
5. ✓ `expect.toBeVisible` `getByTestId("ds-list")` (67ms) — `e2e/design-system-list.e2e.ts:18`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `expect.toBeVisible` `getByTestId("ds-list-expenses")` (106ms) — `e2e/design-system-list.e2e.ts:18`
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `expect.toBeVisible` `getByTestId("ds-list-income")` (25ms) — `e2e/design-system-list.e2e.ts:18`
   - screen: unchanged since step 6 at `com.budgetlens.offline`
8. ✓ `expect.toBeVisible` `getByTestId("ds-row-salary")` (25ms) — `e2e/design-system-list.e2e.ts:18`
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent")` (25ms) — `e2e/design-system-list.e2e.ts:21`
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (23ms) — `e2e/design-system-list.e2e.ts:22`
   - screen: unchanged since step 9 at `com.budgetlens.offline`
11. ✓ `expect.toBeChecked` `getByTestId("ds-row-internet")` (24ms) — `e2e/design-system-list.e2e.ts:23`
   - screen: unchanged since step 10 at `com.budgetlens.offline`
12. ✓ `locator.tap` `getByTestId("ds-row-rent")` (148ms) — `e2e/design-system-list.e2e.ts:26`
   - tap checkbox "Paid: Rent" (148ms)
   - screen: unchanged since step 11 at `com.budgetlens.offline`
13. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (1.6s) — `e2e/design-system-list.e2e.ts:29`
   - screen: 2 changes since step 12 at `com.budgetlens.offline`, 101 nodes
     - `added checkbox "Paid: Rent" testid="ds-row-rent" [checked]`
     - `removed checkbox "Paid: Rent" testid="ds-row-rent"`
14. ✓ `app.screenshot` `list` (1.3s) — `e2e/design-system-list.e2e.ts:31`
   - [screenshot](attempt-1/screenshots/001-list.png) `.e2e/android/results/design-system-list-shows-grouped-transaction-rows-d63b1f3243db92b7/attempt-1/screenshots/001-list.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list.png) `.e2e/android/results/design-system-list-shows-grouped-transaction-rows-d63b1f3243db92b7/attempt-1/screenshots/001-list.png`

<sub>e2e 0.21.2 · run `01a15ab8-f008-795c-8299-cba8bdc69ae0` · the whole run is in `report.json`</sub>
