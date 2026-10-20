# ✓ keeps the list example usable at 200% text size

`e2e/large-text.e2e.ts` · target `android` · passed · 5.3s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.7s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s) — `e2e/support/showcase.ts:53`
   - expect passed after 8 reads in 1.6s: no node (0 matches) x7 -&gt; at 1596ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (205ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (395ms) — `e2e/support/showcase.ts:57`
   - expect passed after 2 reads in 395ms: no node (0 matches) -&gt; at 395ms default states (1 match)
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (180ms) — `e2e/large-text.e2e.ts:53`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `app.screenshot` `large-text-list` (1.3s) — `e2e/large-text.e2e.ts:54`
   - [screenshot](attempt-1/screenshots/001-large-text-list.png) `.e2e/android-large-text/results/large-text-keeps-the-list-example-usable-at-e6a20e9a03898757/attempt-1/screenshots/001-large-text-list.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-list.png) `.e2e/android-large-text/results/large-text-keeps-the-list-example-usable-at-e6a20e9a03898757/attempt-1/screenshots/001-large-text-list.png`

<sub>e2e 0.21.2 · run `01a159b4-47a0-7439-ab4a-020a9afe8511` · the whole run is in `report.json`</sub>
