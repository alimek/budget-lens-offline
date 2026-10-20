# ✓ keeps the list example usable at 200% text size

`e2e/large-text.e2e.ts` · target `ios` · passed · 6.3s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s, video 0:01) — `e2e/support/showcase.ts:53`
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (171ms, video 0:03) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (152ms, video 0:03) — `e2e/support/showcase.ts:57`
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
     - `added text "Due Oct 10, 2026"`
     - `added switch "Paid: Rent" testid="ds-row-rent" value="0"`
     - 16 more
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (149ms, video 0:04) — `e2e/large-text.e2e.ts:53`
   - screen: unchanged since step 4 at `com.budgetlens.offline / List example`
6. ✓ `app.screenshot` `large-text-list` (667ms, video 0:04) — `e2e/large-text.e2e.ts:54`
   - [screenshot](attempt-1/screenshots/001-large-text-list.png) `.e2e/ios-large-text/results/large-text-keeps-the-list-example-usable-at-bf82253483510aa2/attempt-1/screenshots/001-large-text-list.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-list.png) `.e2e/ios-large-text/results/large-text-keeps-the-list-example-usable-at-bf82253483510aa2/attempt-1/screenshots/001-large-text-list.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios-large-text/results/large-text-keeps-the-list-example-usable-at-bf82253483510aa2/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159cf-95f8-764e-b0ca-0e2c15a28d91` · the whole run is in `report.json`</sub>
