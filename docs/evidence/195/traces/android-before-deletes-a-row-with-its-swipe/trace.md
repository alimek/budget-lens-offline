# ✓ deletes a row with its swipe action after confirming

`e2e/design-system-list.e2e.ts` · target `android` · passed · 9.4s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.6s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.5s) — `e2e/support/showcase.ts:53`
   - expect passed after 14 reads in 2.5s: no node (0 matches) x13 -&gt; at 2465ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (215ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (504ms) — `e2e/support/showcase.ts:57`
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (218ms) — `e2e/support/showcase.ts:78`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `screen.swipe` `(918, 499.5) → (270, 499.5)` (551ms) — `e2e/support/showcase.ts:83`
   - swipeTo at (918, 500) (551ms)
7. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent-delete") >> getByRole("group").first()` (139ms) — `e2e/design-system-list.e2e.ts:56`
   - screen: 2 changes since step 5 at `com.budgetlens.offline`, 111 nodes
     - `removed text "Rent"`
     - `removed text "Due Oct 10, 2026"`
8. ✓ `app.screenshot` `list-swipe` (1.3s) — `e2e/design-system-list.e2e.ts:57`
   - [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/195-before/results/design-system-list-deletes-a-row-with-its-swipe-c0f0f536aa1986de/attempt-1/screenshots/001-list-swipe.png`
9. ✓ `locator.tap` `getByTestId("ds-row-rent-delete") >> getByRole("button")` (252ms) — `e2e/support/showcase.ts:38`
   - tap button (252ms)
   - screen: unchanged since step 7 at `com.budgetlens.offline`
10. ✓ `locator.tap` `getByTestId("ds-delete-alert-confirm") >> getByRole("button")` (116ms) — `e2e/design-system-list.e2e.ts:63`
   - tap button (116ms)
   - screen: 104 changes since step 9 at `com.budgetlens.offline`, 17 nodes
     - `added text "Delete “Rent”?"`
     - `added text "The item is removed from every month."`
     - `added group testid="ds-delete-alert-confirm"`
     - `added group testid="ds-delete-alert-cancel"`
     - `added text "Cancel"`
     - `removed group`
     - `removed group`
     - `removed group`
     - `removed group testid="com.budgetlens.offline:id/action_bar_root"`
     - `removed group`
     - `removed group`
     - `removed group`
     - 92 more
11. ✓ `expect.toHaveCount` `getByTestId("ds-row-rent")` (148ms) — `e2e/design-system-list.e2e.ts:66`
   - screen: 78 changes since step 10 at `com.budgetlens.offline`, 85 nodes
     - `added group testid="com.budgetlens.offline:id/action_bar_root"`
     - `added group`
     - `added group`
     - `added group`
     - `added group`
     - `added group`
     - `added button "Navigate up"`
     - `added text "List example"`
     - `added group`
     - `added group`
     - `added group testid="screen-design-system-list"`
     - `added group testid="ds-list"`
     - 66 more
12. ✓ `expect.toBeVisible` `getByTestId("ds-row-internet")` (93ms) — `e2e/design-system-list.e2e.ts:67`
   - screen: unchanged since step 11 at `com.budgetlens.offline`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/195-before/results/design-system-list-deletes-a-row-with-its-swipe-c0f0f536aa1986de/attempt-1/screenshots/001-list-swipe.png`

<sub>e2e 0.21.2 · run `01a15aa8-3f97-7caa-8dd4-87200557efde` · the whole run is in `report.json`</sub>
