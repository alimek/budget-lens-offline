# ✓ keeps the open Android row background unchanged

`e2e/design-system-list.e2e.ts` · target `android` · passed · 13.5s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (3.7s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (6.0s) — `e2e/support/showcase.ts:53`
   - expect passed after 31 reads in 6.0s: no node (0 matches) x30 -&gt; at 6027ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (184ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (771ms) — `e2e/support/showcase.ts:57`
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (80ms) — `e2e/support/showcase.ts:78`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `screen.swipe` `(918, 499.5) → (270, 499.5)` (530ms) — `e2e/support/showcase.ts:83`
   - swipeTo at (918, 500) (530ms)
7. ✓ `expect.toHaveScreenshot` `getByTestId("ds-row-rent") vs android-rent-open.png` (1.4s) — `e2e/design-system-list.e2e.ts:110`
   - screen: 2 changes since step 5 at `com.budgetlens.offline`, 99 nodes
     - `removed text "Rent"`
     - `removed text "Due Oct 10, 2026"`

<sub>e2e 0.21.2 · run `01a15aed-a44c-7fad-b57e-dfd978a609b4` · the whole run is in `report.json`</sub>
