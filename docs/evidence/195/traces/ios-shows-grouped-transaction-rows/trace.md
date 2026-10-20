# ✓ shows grouped transaction rows and toggles the paid state

`e2e/design-system-list.e2e.ts` · target `ios` · passed · 14.0s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.4s, video 0:01) — `e2e/support/showcase.ts:53`
   - expect passed after 3 reads in 2.4s: no node (0 matches) x2 -&gt; at 2431ms default states (1 match)
   - screen: 32 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (435ms, video 0:04) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (236ms, video 0:05) — `e2e/support/showcase.ts:57`
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-list")` (261ms, video 0:06) — `e2e/design-system-list.e2e.ts:18`
   - screen: unchanged since step 4 at `com.budgetlens.offline / List example`
6. ✓ `expect.toBeVisible` `getByTestId("ds-list-expenses")` (232ms, video 0:06) — `e2e/design-system-list.e2e.ts:18`
   - screen: unchanged since step 5 at `com.budgetlens.offline / List example`
7. ✓ `expect.toBeVisible` `getByTestId("ds-list-income")` (237ms, video 0:06) — `e2e/design-system-list.e2e.ts:18`
   - screen: unchanged since step 6 at `com.budgetlens.offline / List example`
8. ✓ `expect.toBeVisible` `getByTestId("ds-row-salary")` (221ms, video 0:06) — `e2e/design-system-list.e2e.ts:18`
   - screen: unchanged since step 7 at `com.budgetlens.offline / List example`
9. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent")` (223ms, video 0:07) — `e2e/design-system-list.e2e.ts:21`
   - screen: unchanged since step 8 at `com.budgetlens.offline / List example`
10. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (218ms, video 0:07) — `e2e/design-system-list.e2e.ts:22`
   - screen: unchanged since step 9 at `com.budgetlens.offline / List example`
11. ✓ `expect.toBeChecked` `getByTestId("ds-row-internet")` (221ms, video 0:07) — `e2e/design-system-list.e2e.ts:23`
   - screen: unchanged since step 10 at `com.budgetlens.offline / List example`
12. ✓ `locator.tap` `getByTestId("ds-row-rent")` (668ms, video 0:07) — `e2e/design-system-list.e2e.ts:26`
   - tap switch "Paid: Rent" (668ms)
   - screen: unchanged since step 11 at `com.budgetlens.offline / List example`
13. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (228ms, video 0:08) — `e2e/design-system-list.e2e.ts:29`
   - screen: 2 changes since step 12 at `com.budgetlens.offline / List example`, 38 nodes
     - `added switch "Paid: Rent" testid="ds-row-rent" value="1" [checked]`
     - `removed switch "Paid: Rent" testid="ds-row-rent" value="0"`
14. ✓ `app.screenshot` `list` (725ms, video 0:08) — `e2e/design-system-list.e2e.ts:31`
   - [screenshot](attempt-1/screenshots/001-list.png) `.e2e/ios/results/design-system-list-shows-grouped-transaction-rows-4468d474d016b4a2/attempt-1/screenshots/001-list.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list.png) `.e2e/ios/results/design-system-list-shows-grouped-transaction-rows-4468d474d016b4a2/attempt-1/screenshots/001-list.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-list-shows-grouped-transaction-rows-4468d474d016b4a2/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15ab2-37bf-7265-955d-8a25db3d60fe` · the whole run is in `report.json`</sub>
