# ✓ keeps the showcase components readable at 200% text size

`e2e/large-text.e2e.ts` · target `ios` · passed · 11.1s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.8s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.2s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 2 reads in 1.2s: no node (0 matches) -&gt; at 1200ms default states (1 match)
   - screen: 28 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (811ms, video 0:02) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (811ms)
   - screen: 1 change since step 2 at `com.budgetlens.offline / Overview`, 29 nodes
     - `added button "Savings" testid="overview-open-savings"`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (800ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (800ms)
   - screen: 15 changes since step 3 at `com.budgetlens.offline / Settings`, 26 nodes
     - `added navigation testid="Settings"`
     - `added text "Settings"`
     - `added other testid="screen-settings"`
     - `added button "Open design system" testid="settings-open-design-system"`
     - `added tab "Overview" testid="tab-overview"`
     - `added tab "Settings" testid="tab-settings" [selected]`
     - `removed navigation testid="Overview"`
     - `removed text "Overview"`
     - `removed other testid="screen-home"`
     - `removed other testid="overview-savings-card"`
     - `removed text "Savings"`
     - `removed text "Savings"`
     - 3 more
5. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (213ms, video 0:05) — `e2e/large-text.e2e.ts:21`
   - screen: 45 changes since step 4 at `com.budgetlens.offline / Design system`, 31 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added text "COMPONENTS"`
     - `added text "COMPONENTS"`
     - `added other testid="ds-card"`
     - `added text "October 2026"`
     - `added text "October 2026"`
     - `added text "Opening balance, income and expenses"`
     - `added text "Opening balance, income and expenses"`
     - 33 more
6. ✓ `app.screenshot` `large-text-components` (718ms, video 0:06) — `e2e/large-text.e2e.ts:23`
   - [screenshot](attempt-1/screenshots/001-large-text-components.png) `.e2e/ios-large-text/results/large-text-keeps-the-showcase-components-a47fc8a2503739f4/attempt-1/screenshots/001-large-text-components.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-components.png) `.e2e/ios-large-text/results/large-text-keeps-the-showcase-components-a47fc8a2503739f4/attempt-1/screenshots/001-large-text-components.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios-large-text/results/large-text-keeps-the-showcase-components-a47fc8a2503739f4/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159cf-95f8-764e-b0ca-0e2c15a28d91` · the whole run is in `report.json`</sub>
