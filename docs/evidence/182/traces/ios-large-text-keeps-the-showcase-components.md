# ✓ keeps the showcase components readable at 200% text size

`e2e/large-text.e2e.ts` · target `ios` · passed · 12.6s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.8s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.0s, video 0:01) — `e2e/support/showcase.ts:10`
   - screen: 32 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (655ms, video 0:03) — `e2e/support/showcase.ts:38`
   - tap button "Settings" (654ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (651ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (651ms)
   - screen: 22 changes since step 3 at `com.budgetlens.offline / Settings`, 30 nodes
     - `added other "Settings"`
     - `added navigation "Settings" testid="Settings"`
     - `added text "Settings"`
     - `added other "Your budget stays on this device." testid="screen-settings"`
     - `added scroll-view "Your budget stays on this device."`
     - `added other "Your budget stays on this device."`
     - `added other "Open design system"`
     - `added button "Open design system" testid="settings-open-design-system"`
     - `added button "Overview" testid="tab-overview"`
     - `added button "Settings" testid="tab-settings" [selected]`
     - `removed other "Overview"`
     - `removed navigation "Overview" testid="Overview"`
     - 10 more
5. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (480ms, video 0:06) — `e2e/large-text.e2e.ts:21`
   - screen: 47 changes since step 4 at `com.budgetlens.offline / Design system`, 27 nodes
     - `added other "Back"`
     - `added navigation "Back" testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other "Vertical scroll bar, 11 pages"`
     - `added other "Vertical scroll bar, 11 pages" testid="screen-design-system"`
     - `added scroll-view "COMPONENTS"`
     - `added other "COMPONENTS"`
     - `added other "COMPONENTS" testid="ds-section-components"`
     - `added text "COMPONENTS"`
     - `added other testid="ds-card"`
     - `added text "October 2026"`
     - 35 more
6. ✓ `app.screenshot` `large-text-components` (993ms, video 0:07) — `e2e/large-text.e2e.ts:23`
   - [screenshot](attempt-1/screenshots/001-large-text-components.png) `.e2e/ios-large-text/results/large-text-keeps-the-showcase-components-a47fc8a2503739f4/attempt-1/screenshots/001-large-text-components.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-components.png) `.e2e/ios-large-text/results/large-text-keeps-the-showcase-components-a47fc8a2503739f4/attempt-1/screenshots/001-large-text-components.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios-large-text/results/large-text-keeps-the-showcase-components-a47fc8a2503739f4/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159b3-8c83-7bfe-a159-d66fab62e9e2` · the whole run is in `report.json`</sub>
