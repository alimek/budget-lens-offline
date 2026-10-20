# ✓ deletes a row with its swipe action after confirming

`e2e/design-system-list.e2e.ts` · target `ios` · passed · 18.8s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.0s, video 0:01) — `e2e/support/showcase.ts:53`
   - expect passed after 3 reads in 2.0s: no node (0 matches) x2 -&gt; at 2000ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (168ms, video 0:03) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (147ms, video 0:04) — `e2e/support/showcase.ts:57`
   - screen: 28 changes since step 2 at `com.budgetlens.offline / List example`, 53 nodes
     - `added navigation testid="List example"`
     - `added button "Back" testid="BackButton"`
     - `added text "List example"`
     - `added button "Add item" testid="ds-add-button"`
     - `added other testid="screen-design-system-list"`
     - `added collection-view testid="ds-list"`
     - `added listitem`
     - `added text "Expenses" testid="ds-list-expenses"`
     - `added listitem`
     - `added text "Rent"`
     - `added switch "Paid: Rent" testid="ds-row-rent" value="0"`
     - `added text "−PLN 2,000.00" text="−PLN 2,000.00"`
     - 16 more
5. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (129ms, video 0:04) — `e2e/design-system-list.e2e.ts:52`
   - screen: 24 changes since step 4 at `com.budgetlens.offline / List example`, 29 nodes
     - `removed navigation testid="Overview"`
     - `removed text "Overview"`
     - `removed other testid="screen-home"`
     - `removed scroll-view`
     - `removed other testid="overview-savings-card"`
     - `removed text "Savings"`
     - `removed text "Savings"`
     - `removed text "Your budget stays on this device."`
     - `removed text "Your budget stays on this device."`
     - `removed button "Savings" testid="overview-open-savings"`
     - `removed other "Vertical scroll bar, 1 page" value="0%"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - 12 more
6. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (125ms, video 0:04) — `e2e/support/showcase.ts:78`
   - screen: unchanged since step 5 at `com.budgetlens.offline / List example`
7. ✓ `screen.swipe` `(334.05, 187.33333333333334) → (98.25, 187.33333333333334)` (1.0s, video 0:05) — `e2e/support/showcase.ts:83`
   - swipeTo at (334, 187) (1.0s)
8. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent-delete")` (143ms, video 0:06) — `e2e/design-system-list.e2e.ts:65`
   - screen: 6 changes since step 6 at `com.budgetlens.offline / List example`, 31 nodes
     - `added button "Edit: Rent" testid="ds-row-rent-edit"`
     - `added text "Edit"`
     - `added button "Delete: Rent" testid="ds-row-rent-delete"`
     - `added text "Delete"`
     - `removed text "Rent"`
     - `removed switch "Paid: Rent" testid="ds-row-rent" value="0"`
9. ✓ `app.screenshot` `list-swipe` (641ms, video 0:07) — `e2e/design-system-list.e2e.ts:66`
   - [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/195-final-ios/results/design-system-list-deletes-a-row-with-its-swipe-6c0997de4b95e887/attempt-1/screenshots/001-list-swipe.png`
10. ✓ `locator.tap` `getByTestId("ds-row-rent-delete")` (605ms, video 0:07) — `e2e/support/showcase.ts:38`
   - tap button "Delete: Rent" (604ms)
   - screen: unchanged since step 8 at `com.budgetlens.offline / List example`
11. ✓ `locator.tap` `getByTestId("ds-row-rent-delete")` (597ms, video 0:13) — `e2e/support/showcase.ts:38`
   - tap button "Delete: Rent" (597ms)
   - screen: unchanged since step 10 at `com.budgetlens.offline / List example`
12. ✓ `locator.tap` `getByRole("group", name: "Delete “Rent”?") >> getByRole("button").last()` (607ms, video 0:14) — `e2e/design-system-list.e2e.ts:72`
   - tap button "Delete" (607ms)
   - screen: 22 changes since step 11 at `com.budgetlens.offline / List example`, 39 nodes
     - `added group "Delete “Rent”?"`
     - `added scroll-view`
     - `added text "Delete “Rent”?"`
     - `added text "The item is removed from every month."`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - `added other "Horizontal scroll bar, 1 page" value="0%"`
     - `added scroll-view`
     - `added button "Cancel"`
     - `added button "Delete"`
     - `added other "Vertical scroll bar, 1 page" value="0%"`
     - 10 more
13. ✓ `expect.toHaveCount` `getByTestId("ds-row-rent")` (132ms, video 0:15) — `e2e/design-system-list.e2e.ts:75`
   - screen: 15 changes since step 12 at `com.budgetlens.offline / List example`, 24 nodes
     - `removed other "Vertical scroll bar, 1 page" value="0%"`
     - `removed other "Vertical scroll bar, 1 page" value="0%"`
     - `removed group "Delete “Rent”?"`
     - `removed scroll-view`
     - `removed text "Delete “Rent”?"`
     - `removed text "The item is removed from every month."`
     - `removed other "Vertical scroll bar, 1 page" value="0%"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed other "Vertical scroll bar, 1 page" value="0%"`
     - `removed other "Horizontal scroll bar, 1 page" value="0%"`
     - `removed scroll-view`
     - `removed button "Cancel"`
     - 3 more
14. ✓ `expect.toBeVisible` `getByTestId("ds-row-internet")` (136ms, video 0:15) — `e2e/design-system-list.e2e.ts:76`
   - screen: unchanged since step 13 at `com.budgetlens.offline / List example`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/195-final-ios/results/design-system-list-deletes-a-row-with-its-swipe-6c0997de4b95e887/attempt-1/screenshots/001-list-swipe.png`
- [video](attempt-1/video/video.mp4) `.e2e/195-final-ios/results/design-system-list-deletes-a-row-with-its-swipe-6c0997de4b95e887/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15ac3-2cee-7714-807a-a1992c97be01` · the whole run is in `report.json`</sub>
