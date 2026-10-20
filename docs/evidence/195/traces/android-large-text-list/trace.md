# ✓ keeps the list example usable at 200% text size

`e2e/large-text.e2e.ts` · target `android` · passed · 6.2s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.3s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.7s) — `e2e/support/showcase.ts:53`
   - expect passed after 16 reads in 2.7s: no node (0 matches) x15 -&gt; at 2690ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (224ms) — `e2e/support/showcase.ts:54`
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (200ms) — `e2e/large-text.e2e.ts:61`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `app.screenshot` `large-text-list` (1.3s) — `e2e/large-text.e2e.ts:62`
   - [screenshot](attempt-1/screenshots/001-large-text-list.png) `.e2e/android-large-text/results/large-text-keeps-the-list-example-usable-at-e6a20e9a03898757/attempt-1/screenshots/001-large-text-list.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-list.png) `.e2e/android-large-text/results/large-text-keeps-the-list-example-usable-at-e6a20e9a03898757/attempt-1/screenshots/001-large-text-list.png`

<sub>e2e 0.21.2 · run `01a15abd-2203-753e-b73c-b979e4048cd5` · the whole run is in `report.json`</sub>
