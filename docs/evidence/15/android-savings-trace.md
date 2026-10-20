# ✓ opens Savings inside Overview

`e2e/scaffold.e2e.ts` · target `android` · passed · 6.6s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (3.0s) — `e2e/scaffold.e2e.ts:32`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.4s) — `e2e/scaffold.e2e.ts:33`
   - expect passed after 9 reads in 1.4s: no node (0 matches) x8 -&gt; at 1408ms default states (1 match)
   - screen: 49 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("overview-open-savings") >> getByRole("button")` (389ms) — `e2e/scaffold.e2e.ts:39`
   - tap button (389ms)
   - screen: 2 changes since step 2 at `com.budgetlens.offline`, 51 nodes
     - `added image testid="com.budgetlens.offline:id/navigation_bar_item_icon_view" [selected]`
     - `added text "Overview" testid="com.budgetlens.offline:id/navigation_bar_item_large_label_view" [selected]`
4. ✓ `expect.toBeVisible` `getByTestId("screen-savings")` (194ms) — `e2e/scaffold.e2e.ts:42`
   - screen: 8 changes since step 3 at `com.budgetlens.offline`, 47 nodes
     - `added button "Navigate up"`
     - `added group testid="screen-savings"`
     - `removed group`
     - `removed group`
     - `removed text "Overview"`
     - `removed group testid="screen-home"`
     - `removed group testid="overview-open-savings"`
     - `removed button`
5. ✓ `app.screenshot` `savings` (1.7s) — `e2e/scaffold.e2e.ts:43`
   - [screenshot](android-savings.png) (committed copy of `attempt-1/screenshots/001-savings.png`)

## Evidence

- [screenshot](android-savings.png) (committed copy of `attempt-1/screenshots/001-savings.png`)

<sub>e2e 0.21.2 · run `01a158e3-5647-7c6f-9393-815c4f62500d` · the whole run is in `report.json`</sub>
