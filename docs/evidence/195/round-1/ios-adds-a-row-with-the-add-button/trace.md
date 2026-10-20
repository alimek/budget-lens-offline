# ✓ adds a row with the add button

`e2e/design-system-list.e2e.ts` · target `ios` · passed · 12.4s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (3.7s, video 0:01) — `e2e/support/showcase.ts:53`
   - expect passed after 3 reads in 3.7s: no node (0 matches) x2 -&gt; at 3672ms default states (1 match)
   - screen: 30 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (551ms, video 0:05) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (229ms, video 0:07) — `e2e/support/showcase.ts:57`
   - screen: 56 changes since step 2 at `com.budgetlens.offline / List example`, 38 nodes
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
     - 44 more
5. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-add-button")` (230ms, video 0:07) — `e2e/design-system-list.e2e.ts:39`
   - screen: unchanged since step 4 at `com.budgetlens.offline / List example`
6. ✓ `locator.tap` `getByTestId("ds-add-button")` (680ms, video 0:07) — `e2e/support/showcase.ts:38`
   - tap button "Add item" (680ms)
   - screen: unchanged since step 5 at `com.budgetlens.offline / List example`
7. ✓ `app.screenshot` `list-added` (753ms, video 0:08) — `e2e/design-system-list.e2e.ts:43`
   - [screenshot](attempt-1/screenshots/001-list-added.png) `.e2e/ios/results/design-system-list-adds-a-row-with-the-add-button-63df2cbda5770ab2/attempt-1/screenshots/001-list-added.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-added.png) `.e2e/ios/results/design-system-list-adds-a-row-with-the-add-button-63df2cbda5770ab2/attempt-1/screenshots/001-list-added.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-list-adds-a-row-with-the-add-button-63df2cbda5770ab2/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15af2-5879-7516-bf31-f3ab2edcfd82` · the whole run is in `report.json`</sub>
