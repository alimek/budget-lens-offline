# ✓ keeps the list example usable at 200% text size

`e2e/large-text.e2e.ts` · target `ios` · passed · 7.0s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:52`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.1s, video 0:01) — `e2e/support/showcase.ts:53`
   - expect passed after 5 reads in 2.1s: no node (0 matches) x4 -&gt; at 2116ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `device.openLink` `budget-lens:///dev/design-system-list` (175ms, video 0:04) — `e2e/support/showcase.ts:54`
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
     - `added text "Due Oct 10, 2026"`
     - `added switch "Paid: Rent" testid="ds-row-rent" value="0"`
     - 16 more
5. ✓ `expect.toBeVisible` `getByTestId("ds-row-rent")` (128ms, video 0:05) — `e2e/large-text.e2e.ts:61`
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
6. ✓ `app.screenshot` `large-text-list` (639ms, video 0:05) — `e2e/large-text.e2e.ts:62`
   - [screenshot](attempt-1/screenshots/001-large-text-list.png) `.e2e/ios-large-text/results/large-text-keeps-the-list-example-usable-at-bf82253483510aa2/attempt-1/screenshots/001-large-text-list.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-list.png) `.e2e/ios-large-text/results/large-text-keeps-the-list-example-usable-at-bf82253483510aa2/attempt-1/screenshots/001-large-text-list.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios-large-text/results/large-text-keeps-the-list-example-usable-at-bf82253483510aa2/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15abe-2930-7128-957f-2fb7b915fe9d` · the whole run is in `report.json`</sub>
