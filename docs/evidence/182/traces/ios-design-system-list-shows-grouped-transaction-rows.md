# ✓ shows grouped transaction rows and toggles the paid state

`e2e/design-system-list.e2e.ts` · target `ios` · passed · 10.8s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s, video 0:01) — `e2e/support/showcase.ts:53`
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (168ms, video 0:03) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (148ms, video 0:03) — `e2e/support/showcase.ts:57`
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-list")` (148ms, video 0:04) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 4 at `com.budgetlens.offline / List example`
6. ✓ `expect.toBeVisible` `getByTestId("ds-list-expenses")` (150ms, video 0:04) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 5 at `com.budgetlens.offline / List example`
7. ✓ `expect.toBeVisible` `getByTestId("ds-list-income")` (129ms, video 0:04) — `e2e/design-system-list.e2e.ts:10`
   - screen: 24 changes since step 6 at `com.budgetlens.offline / List example`, 29 nodes
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
8. ✓ `expect.toBeVisible` `getByTestId("ds-row-salary")` (127ms, video 0:04) — `e2e/design-system-list.e2e.ts:10`
   - screen: unchanged since step 7 at `com.budgetlens.offline / List example`
9. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-row-rent")` (126ms, video 0:04) — `e2e/design-system-list.e2e.ts:15`
   - screen: unchanged since step 8 at `com.budgetlens.offline / List example`
10. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (125ms, video 0:04) — `e2e/design-system-list.e2e.ts:16`
   - screen: unchanged since step 9 at `com.budgetlens.offline / List example`
11. ✓ `expect.toBeChecked` `getByTestId("ds-row-internet")` (124ms, video 0:04) — `e2e/design-system-list.e2e.ts:17`
   - screen: unchanged since step 10 at `com.budgetlens.offline / List example`
12. ✓ `locator.tap` `getByTestId("ds-row-rent")` (805ms, video 0:04) — `e2e/design-system-list.e2e.ts:20`
   - tap switch "Paid: Rent" (805ms)
   - screen: unchanged since step 11 at `com.budgetlens.offline / List example`
13. ✓ `expect.toBeChecked` `getByTestId("ds-row-rent")` (143ms, video 0:05) — `e2e/design-system-list.e2e.ts:23`
   - screen: 2 changes since step 12 at `com.budgetlens.offline / List example`, 29 nodes
     - `added switch "Paid: Rent" testid="ds-row-rent" value="1" [checked]`
     - `removed switch "Paid: Rent" testid="ds-row-rent" value="0"`
14. ✓ `app.screenshot` `list` (628ms, video 0:05) — `e2e/design-system-list.e2e.ts:25`
   - [screenshot](attempt-1/screenshots/001-list.png) `.e2e/ios/results/design-system-list-shows-grouped-transaction-rows-4468d474d016b4a2/attempt-1/screenshots/001-list.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list.png) `.e2e/ios/results/design-system-list-shows-grouped-transaction-rows-4468d474d016b4a2/attempt-1/screenshots/001-list.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-list-shows-grouped-transaction-rows-4468d474d016b4a2/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159cb-b68f-7040-977a-1fa30cd7f30b` · the whole run is in `report.json`</sub>
