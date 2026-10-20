# ✓ deletes a row with its swipe action after confirming

`e2e/design-system-list.e2e.ts` · target `ios` · passed · 12.9s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.8s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.2s, video 0:01) — `e2e/support/showcase.ts:53`
   - expect passed after 5 reads in 2.2s: no node (0 matches) x4 -&gt; at 2173ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (170ms, video 0:03) — `e2e/support/showcase.ts:54`
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (131ms, video 0:04) — `e2e/support/showcase.ts:78`
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
6. ✓ `screen.swipe` `(334.05, 187.33333333333334) → (98.25, 187.33333333333334)` (1.0s, video 0:05) — `e2e/support/showcase.ts:83`
   - swipeTo at (334, 187) (1.0s)
7. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent-delete")` (138ms, video 0:06) — `e2e/design-system-list.e2e.ts:56`
   - screen: 6 changes since step 5 at `com.budgetlens.offline / List example`, 31 nodes
     - `added button "Edit: Rent" testid="ds-row-rent-edit"`
     - `added text "Edit"`
     - `added button "Delete: Rent" testid="ds-row-rent-delete"`
     - `added text "Delete"`
     - `removed text "Rent"`
     - `removed switch "Paid: Rent" testid="ds-row-rent" value="0"`
8. ✓ `app.screenshot` `list-swipe` (649ms, video 0:07) — `e2e/design-system-list.e2e.ts:57`
   - [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/ios/results/design-system-list-deletes-a-row-with-its-swipe-6c0997de4b95e887/attempt-1/screenshots/001-list-swipe.png`
9. ✓ `locator.tap` `getByTestId("ds-row-rent-delete")` (583ms, video 0:07) — `e2e/support/showcase.ts:38`
   - tap button "Delete: Rent" (582ms)
   - screen: unchanged since step 7 at `com.budgetlens.offline / List example`
10. ✓ `locator.tap` `getByRole("group", name: "Delete “Rent”?") >> getByRole("button").last()` (591ms, video 0:09) — `e2e/design-system-list.e2e.ts:63`
   - tap button "Delete" (591ms)
   - screen: 22 changes since step 9 at `com.budgetlens.offline / List example`, 39 nodes
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
11. ✓ `expect.toHaveCount` `getByTestId("ds-row-rent")` (131ms, video 0:09) — `e2e/design-system-list.e2e.ts:66`
   - screen: 15 changes since step 10 at `com.budgetlens.offline / List example`, 24 nodes
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
12. ✓ `expect.toBeVisible` `getByTestId("ds-row-internet")` (145ms, video 0:09) — `e2e/design-system-list.e2e.ts:67`
   - screen: unchanged since step 11 at `com.budgetlens.offline / List example`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-swipe.png) `.e2e/ios/results/design-system-list-deletes-a-row-with-its-swipe-6c0997de4b95e887/attempt-1/screenshots/001-list-swipe.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-list-deletes-a-row-with-its-swipe-6c0997de4b95e887/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a83-1563-7d9f-9b7f-3444075e9392` · the whole run is in `report.json`</sub>
