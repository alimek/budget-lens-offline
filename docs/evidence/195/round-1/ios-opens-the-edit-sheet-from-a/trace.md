# ✓ opens the edit sheet from a swipe action

`e2e/design-system-list.e2e.ts` · target `ios` · passed · 14.1s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.5s, video 0:01) — `e2e/support/showcase.ts:53`
   - expect passed after 3 reads in 2.5s: no node (0 matches) x2 -&gt; at 2465ms default states (1 match)
   - screen: 32 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (445ms, video 0:04) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (289ms, video 0:06) — `e2e/support/showcase.ts:57`
   - screen: 58 changes since step 2 at `com.budgetlens.offline / List example`, 38 nodes
     - `added other "Back"`
     - `added navigation "Back" testid="List example"`
     - `added button "Back" testid="BackButton"`
     - `added text "List example"`
     - `added other "Add item"`
     - `added button "Add item" testid="ds-add-button"`
     - `added other testid="screen-design-system-list"`
     - `added collection-view "Vertical scroll bar, 1 page" testid="ds-list"`
     - `added listitem "Expenses"`
     - `added other "Expenses"`
     - `added other "Expenses"`
     - `added text "Expenses" testid="ds-list-expenses"`
     - 46 more
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-internet")` (269ms, video 0:06) — `e2e/support/showcase.ts:78`
   - screen: unchanged since step 4 at `com.budgetlens.offline / List example`
6. ✓ `screen.swipe` `(334.05, 255.33333333333331) → (98.25, 255.33333333333331)` (998ms, video 0:07) — `e2e/support/showcase.ts:83`
   - swipeTo at (334, 255) (997ms)
7. ✓ `locator.tap` `getByTestId("ds-row-internet-edit")` (766ms, video 0:08) — `e2e/support/showcase.ts:38`
   - tap button "Edit: Internet" (766ms)
   - screen: 10 changes since step 5 at `com.budgetlens.offline / List example`, 44 nodes
     - `added other "Edit: Internet"`
     - `added other "Edit: Internet"`
     - `added other "Edit: Internet"`
     - `added button "Edit: Internet" testid="ds-row-internet-edit"`
     - `added text "Edit"`
     - `added other "Delete: Internet"`
     - `added button "Delete: Internet" testid="ds-row-internet-delete"`
     - `added text "Delete"`
     - `removed text "Internet"`
     - `removed switch "Paid: Internet" testid="ds-row-internet" value="1" [checked]`
8. ✓ `app.screenshot` `list-edit-sheet` (746ms, video 0:10) — `e2e/design-system-list.e2e.ts:95`
   - [screenshot](attempt-1/screenshots/001-list-edit-sheet.png) `.e2e/ios/results/design-system-list-opens-the-edit-sheet-from-a-0254a1fb30ad155b/attempt-1/screenshots/001-list-edit-sheet.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-edit-sheet.png) `.e2e/ios/results/design-system-list-opens-the-edit-sheet-from-a-0254a1fb30ad155b/attempt-1/screenshots/001-list-edit-sheet.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-list-opens-the-edit-sheet-from-a-0254a1fb30ad155b/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15af2-5879-7516-bf31-f3ab2edcfd82` · the whole run is in `report.json`</sub>
