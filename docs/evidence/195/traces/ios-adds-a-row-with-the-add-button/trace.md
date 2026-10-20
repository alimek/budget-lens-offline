# ✓ adds a row with the add button

`e2e/design-system-list.e2e.ts` · target `ios` · passed · 9.3s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.0s, video 0:01) — `e2e/support/showcase.ts:53`
   - expect passed after 3 reads in 2.0s: no node (0 matches) x2 -&gt; at 2029ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (176ms, video 0:03) — `e2e/support/showcase.ts:54`
4. ✓ `expect.toBeVisible` `getByTestId("screen-design-system-list")` (149ms, video 0:04) — `e2e/support/showcase.ts:57`
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
5. ✓ `expect.toHaveAccessibleName` `getByTestId("ds-add-button")` (127ms, video 0:04) — `e2e/design-system-list.e2e.ts:39`
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
6. ✓ `locator.tap` `getByTestId("ds-add-button")` (801ms, video 0:05) — `e2e/support/showcase.ts:38`
   - tap button "Add item" (801ms)
   - screen: unchanged since step 5 at `com.budgetlens.offline / List example`
7. ✓ `app.screenshot` `list-added` (660ms, video 0:05) — `e2e/design-system-list.e2e.ts:43`
   - [screenshot](attempt-1/screenshots/001-list-added.png) `.e2e/ios/results/design-system-list-adds-a-row-with-the-add-button-63df2cbda5770ab2/attempt-1/screenshots/001-list-added.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-list-added.png) `.e2e/ios/results/design-system-list-adds-a-row-with-the-add-button-63df2cbda5770ab2/attempt-1/screenshots/001-list-added.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-list-adds-a-row-with-the-add-button-63df2cbda5770ab2/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15ab2-37bf-7265-955d-8a25db3d60fe` · the whole run is in `report.json`</sub>
