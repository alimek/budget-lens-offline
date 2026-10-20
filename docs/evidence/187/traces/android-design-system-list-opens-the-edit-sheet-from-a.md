# ✓ opens the edit sheet from a swipe action

`e2e/design-system-list.e2e.ts` · target `android` · passed · 8.9s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.3s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (3.1s) — `e2e/support/showcase.ts:53`
   - expect passed after 18 reads in 3.1s: no node (0 matches) x17 -&gt; at 3135ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (220ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (565ms) — `e2e/support/showcase.ts:57`
   - screen: 103 changes since step 2 at `com.budgetlens.offline`, 113 nodes
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
     - `added group testid="ds-row-rent-edit"`
     - 91 more
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-internet")` (121ms) — `e2e/support/showcase.ts:78`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `screen.swipe` `(918, 688.5) → (270, 688.5)` (525ms) — `e2e/support/showcase.ts:83`
   - swipeTo at (918, 689) (525ms)
7. ✓ `locator.tap` `getByTestId("ds-row-internet-edit") >> getByRole("button")` (239ms) — `e2e/support/showcase.ts:38`
   - tap button (239ms)
   - screen: 2 changes since step 5 at `com.budgetlens.offline`, 111 nodes
     - `removed text "Internet"`
     - `removed text "Due Oct 15, 2026"`
8. ✓ `app.screenshot` `list-edit-sheet` (1.2s) — `e2e/design-system-list.e2e.ts:84`
   - [screenshot](attempt-1/screenshots/001-list-edit-sheet.png) `.e2e/android/results/design-system-list-opens-the-edit-sheet-from-a-0b71ccbd10c320d4/attempt-1/screenshots/001-list-edit-sheet.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-edit-sheet.png) `.e2e/android/results/design-system-list-opens-the-edit-sheet-from-a-0b71ccbd10c320d4/attempt-1/screenshots/001-list-edit-sheet.png`

<sub>e2e 0.21.2 · run `01a15a89-0509-7b87-ba1d-1351665f42eb` · the whole run is in `report.json`</sub>
