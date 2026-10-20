# ✓ opens the edit sheet from a swipe action

`e2e/design-system-list.e2e.ts` · target `ios` · passed · 11.9s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.2s, video 0:01) — `e2e/support/showcase.ts:53`
   - expect passed after 5 reads in 2.2s: no node (0 matches) x4 -&gt; at 2176ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (172ms, video 0:04) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (145ms, video 0:04) — `e2e/support/showcase.ts:57`
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-internet")` (128ms, video 0:05) — `e2e/support/showcase.ts:78`
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
6. ✓ `screen.swipe` `(334.05, 255.33333333333331) → (98.25, 255.33333333333331)` (1.0s, video 0:05) — `e2e/support/showcase.ts:83`
   - swipeTo at (334, 255) (1.0s)
7. ✓ `locator.tap` `getByTestId("ds-row-internet-edit")` (596ms, video 0:07) — `e2e/support/showcase.ts:38`
   - tap button "Edit" (596ms)
   - screen: 6 changes since step 5 at `com.budgetlens.offline / List example`, 31 nodes
     - `added button "Edit" testid="ds-row-internet-edit"`
     - `added text "Edit"`
     - `added button "Delete" testid="ds-row-internet-delete"`
     - `added text "Delete"`
     - `removed text "Internet"`
     - `removed switch "Paid: Internet" testid="ds-row-internet" value="1" [checked]`
8. ✓ `app.screenshot` `list-edit-sheet` (653ms, video 0:08) — `e2e/design-system-list.e2e.ts:84`
   - [screenshot](attempt-1/screenshots/001-list-edit-sheet.png) `.e2e/ios/results/design-system-list-opens-the-edit-sheet-from-a-0254a1fb30ad155b/attempt-1/screenshots/001-list-edit-sheet.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-edit-sheet.png) `.e2e/ios/results/design-system-list-opens-the-edit-sheet-from-a-0254a1fb30ad155b/attempt-1/screenshots/001-list-edit-sheet.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-list-opens-the-edit-sheet-from-a-0254a1fb30ad155b/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a60-4611-79ab-9b58-ab346949ac12` · the whole run is in `report.json`</sub>
