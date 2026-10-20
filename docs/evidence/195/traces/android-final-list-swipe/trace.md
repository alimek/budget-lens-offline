# ✓ deletes a row with its swipe action after confirming

`e2e/design-system-list.e2e.ts` · target `android` · passed · 9.2s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.3s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.7s) — `e2e/support/showcase.ts:53`
   - expect passed after 18 reads in 2.7s: no node (0 matches) x17 -&gt; at 2682ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (215ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (505ms) — `e2e/support/showcase.ts:57`
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
5. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (161ms) — `e2e/design-system-list.e2e.ts:52`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `expect.toBeVisible` `getByRole("checkbox", name: "Paid: Rent")` (28ms) — `e2e/design-system-list.e2e.ts:54`
   - screen: unchanged since step 5 at `com.budgetlens.offline`
7. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent-delete") >> getByRole("group").first()` (27ms) — `e2e/design-system-list.e2e.ts:56`
   - screen: unchanged since step 6 at `com.budgetlens.offline`
8. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent-edit") >> getByRole("group").first()` (25ms) — `e2e/design-system-list.e2e.ts:59`
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (26ms) — `e2e/support/showcase.ts:78`
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `screen.swipe` `(918, 499.5) → (270, 499.5)` (527ms) — `e2e/support/showcase.ts:83`
   - swipeTo at (918, 500) (527ms)
11. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (132ms) — `e2e/design-system-list.e2e.ts:63`
   - screen: 2 changes since step 9 at `com.budgetlens.offline`, 99 nodes
     - `removed text "Rent"`
     - `removed text "Due Oct 10, 2026"`
12. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent-delete") >> getByRole("group").first()` (98ms) — `e2e/design-system-list.e2e.ts:65`
   - screen: unchanged since step 11 at `com.budgetlens.offline`
13. ✓ `app.screenshot` `list-swipe` (1.2s) — `e2e/design-system-list.e2e.ts:66`
   - [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/195-final-android/results/design-system-list-deletes-a-row-with-its-swipe-c0f0f536aa1986de/attempt-1/screenshots/001-list-swipe.png`
14. ✓ `locator.tap` `getByTestId("ds-row-rent-delete") >> getByRole("button")` (235ms) — `e2e/support/showcase.ts:38`
   - tap button (235ms)
   - screen: unchanged since step 12 at `com.budgetlens.offline`
15. ✓ `locator.tap` `getByTestId("ds-delete-alert-confirm") >> getByRole("button")` (107ms) — `e2e/design-system-list.e2e.ts:72`
   - tap button (107ms)
   - screen: 92 changes since step 14 at `com.budgetlens.offline`, 17 nodes
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
     - 80 more
16. ✓ `expect.toHaveCount` `getByTestId("ds-row-rent")` (166ms) — `e2e/design-system-list.e2e.ts:75`
   - screen: 70 changes since step 15 at `com.budgetlens.offline`, 77 nodes
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
     - 58 more
17. ✓ `expect.toBeVisible` `getByTestId("ds-row-internet")` (86ms) — `e2e/design-system-list.e2e.ts:76`
   - screen: unchanged since step 16 at `com.budgetlens.offline`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/195-final-android/results/design-system-list-deletes-a-row-with-its-swipe-c0f0f536aa1986de/attempt-1/screenshots/001-list-swipe.png`

<sub>e2e 0.21.2 · run `01a15ac2-71c4-71c8-b32c-db638749113b` · the whole run is in `report.json`</sub>
