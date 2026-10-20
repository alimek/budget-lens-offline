# ✓ opens Savings inside Overview

`e2e/scaffold.e2e.ts` · target `android` · passed · 5.2s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.6s) — `e2e/scaffold.e2e.ts:32`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s) — `e2e/scaffold.e2e.ts:33`
   - expect passed after 9 reads in 1.6s: no node (0 matches) x8 -&gt; at 1632ms default states (1 match)
   - screen: 51 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("overview-open-savings") >> getByRole("button")` (327ms) — `e2e/scaffold.e2e.ts:39`
   - tap button (327ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `expect.toBeVisible` `getByTestId("screen-savings")` (238ms) — `e2e/scaffold.e2e.ts:42`
   - screen: 8 changes since step 3 at `com.budgetlens.offline`, 47 nodes
     - `added button "Navigate up"`
     - `added group testid="screen-savings"`
     - `removed group`
     - `removed group`
     - `removed text "Overview"`
     - `removed group testid="screen-home"`
     - `removed group testid="overview-open-savings"`
     - `removed button`
5. ✓ `app.screenshot` `savings` (1.4s) — `e2e/scaffold.e2e.ts:43`
   - [screenshot](android-savings.png) (committed copy of `attempt-1/screenshots/001-savings.png`)

## Evidence

- [screenshot](android-savings.png) (committed copy of `attempt-1/screenshots/001-savings.png`)

<sub>e2e 0.21.2 · run `01a158d7-d2c1-7fb9-ad83-929de391fe11` · the whole run is in `report.json`</sub>
