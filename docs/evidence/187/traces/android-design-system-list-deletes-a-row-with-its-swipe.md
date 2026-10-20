# ✓ deletes a row with its swipe action after confirming

`e2e/design-system-list.e2e.ts` · target `android` · passed · 9.3s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.3s) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.9s) — `e2e/support/showcase.ts:53`
   - expect passed after 18 reads in 2.9s: no node (0 matches) x17 -&gt; at 2882ms default states (1 match)
   - screen: 30 nodes at `com.budgetlens.offline`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (346ms) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (372ms) — `e2e/support/showcase.ts:57`
   - screen: 93 changes since step 2 at `com.budgetlens.offline`, 113 nodes
     - `added button "Navigate up"`
     - `added text "List example"`
     - `added group testid="screen-design-system-list"`
     - `added group testid="ds-list"`
     - `added text "Expenses" testid="ds-list-expenses"`
     - `added group`
     - `added group testid="ds-row-rent"`
     - `added group "Paid: Rent"`
     - `added text "Rent"`
     - `added text "Due Oct 10, 2026"`
     - `added text "−PLN 2,000.00" text="−PLN 2,000.00"`
     - `added checkbox`
     - 81 more
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (202ms) — `e2e/support/showcase.ts:78`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `screen.swipe` `(918, 499.5) → (270, 499.5)` (525ms) — `e2e/support/showcase.ts:83`
   - swipeTo at (918, 500) (525ms)
7. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent-delete") >> getByRole("group").first()` (158ms) — `e2e/design-system-list.e2e.ts:56`
   - screen: 2 changes since step 5 at `com.budgetlens.offline`, 111 nodes
     - `removed text "Rent"`
     - `removed text "Due Oct 10, 2026"`
8. ✓ `app.screenshot` `list-swipe` (1.3s) — `e2e/design-system-list.e2e.ts:57`
   - [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/android/results/design-system-list-deletes-a-row-with-its-swipe-c0f0f536aa1986de/attempt-1/screenshots/001-list-swipe.png`
9. ✓ `locator.tap` `getByTestId("ds-row-rent-delete") >> getByRole("button")` (240ms) — `e2e/support/showcase.ts:38`
   - tap button (240ms)
   - screen: unchanged since step 7 at `com.budgetlens.offline`
10. ✓ `locator.tap` `getByTestId("ds-delete-alert-confirm") >> getByRole("button")` (114ms) — `e2e/design-system-list.e2e.ts:63`
   - tap button (114ms)
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
11. ✓ `expect.toHaveCount` `getByTestId("ds-row-rent")` (167ms) — `e2e/design-system-list.e2e.ts:66`
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
12. ✓ `expect.toBeVisible` `getByTestId("ds-row-internet")` (96ms) — `e2e/design-system-list.e2e.ts:67`
   - screen: unchanged since step 11 at `com.budgetlens.offline`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/android/results/design-system-list-deletes-a-row-with-its-swipe-c0f0f536aa1986de/attempt-1/screenshots/001-list-swipe.png`

<sub>e2e 0.21.2 · run `01a15a66-5acb-721b-99db-d0468601074d` · the whole run is in `report.json`</sub>
