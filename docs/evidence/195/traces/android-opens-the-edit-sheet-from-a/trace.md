# ✓ opens the edit sheet from a swipe action

`e2e/design-system-list.e2e.ts` · target `android` · passed · 8.8s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.4s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.8s) — `e2e/support/showcase.ts:53`
   - expect passed after 17 reads in 2.8s: no node (0 matches) x16 -&gt; at 2821ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (236ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (502ms) — `e2e/support/showcase.ts:57`
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-internet")` (208ms) — `e2e/support/showcase.ts:78`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `screen.swipe` `(918, 688.5) → (270, 688.5)` (523ms) — `e2e/support/showcase.ts:83`
   - swipeTo at (918, 689) (523ms)
7. ✓ `expect.toBeChecked` `getByTestId("ds-row-internet")` (152ms) — `e2e/design-system-list.e2e.ts:86`
   - screen: 2 changes since step 5 at `com.budgetlens.offline`, 99 nodes
     - `removed text "Internet"`
     - `removed text "Due Oct 15, 2026"`
8. ✓ `locator.tap` `getByTestId("ds-row-internet-edit") >> getByRole("button")` (189ms) — `e2e/support/showcase.ts:38`
   - tap button (189ms)
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `app.screenshot` `list-edit-sheet` (1.2s) — `e2e/design-system-list.e2e.ts:96`
   - [screenshot](attempt-1/screenshots/001-list-edit-sheet.png) `.e2e/android/results/design-system-list-opens-the-edit-sheet-from-a-0b71ccbd10c320d4/attempt-1/screenshots/001-list-edit-sheet.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-edit-sheet.png) `.e2e/android/results/design-system-list-opens-the-edit-sheet-from-a-0b71ccbd10c320d4/attempt-1/screenshots/001-list-edit-sheet.png`

<sub>e2e 0.21.2 · run `01a15ab8-f008-795c-8299-cba8bdc69ae0` · the whole run is in `report.json`</sub>
