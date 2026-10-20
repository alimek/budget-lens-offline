# ✓ shows the design system components in light mode

`e2e/design-system.e2e.ts` · target `ios` · passed · 18.8s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `device.setAppearance` `light` (99ms, video 0:00) — `e2e/design-system.e2e.ts:34`
2. ✓ `app.open` (1.8s, video 0:00) — `e2e/design-system.e2e.ts:8`
3. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (3.1s, video 0:01) — `e2e/design-system.e2e.ts:9`
   - screen: 32 nodes at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("tab-settings")` (635ms, video 0:05) — `e2e/design-system.e2e.ts:10`
   - tap button "Settings" (635ms)
   - screen: unchanged since step 3 at `com.budgetlens.offline / Overview`
5. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (1.2s, video 0:05) — `e2e/design-system.e2e.ts:12`
   - tap button "Open design system" (1.2s)
   - screen: 22 changes since step 4 at `com.budgetlens.offline / Settings`, 30 nodes
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
6. ✓ `expect.toBeVisible` `getByTestId("screen-design-system")` (575ms, video 0:06) — `e2e/design-system.e2e.ts:13`
   - screen: 60 changes since step 5 at `com.budgetlens.offline / Design system`, 86 nodes
     - `added other "Back"`
     - `added navigation "Back" testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other "Toolbar"`
     - `added other "Vertical scroll bar, 4 pages"`
     - `added other "Vertical scroll bar, 4 pages" testid="screen-design-system"`
     - `added scroll-view "COMPONENTS"`
     - `added other "COMPONENTS"`
     - `added other "COMPONENTS" testid="ds-section-components"`
     - `added text "COMPONENTS"`
     - `added other testid="ds-card"`
     - 48 more
7. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (452ms, video 0:07) — `e2e/design-system.e2e.ts:41`
   - screen: 26 changes since step 6 at `com.budgetlens.offline / Design system`, 60 nodes
     - `removed other "Toolbar"`
     - `removed other "Tab Bar"`
     - `removed other "Settings"`
     - `removed navigation "Settings" testid="Settings"`
     - `removed text "Settings"`
     - `removed other "Vertical scroll bar, 1 page"`
     - `removed other "Your budget stays on this device." testid="screen-settings"`
     - `removed scroll-view "Your budget stays on this device."`
     - `removed other "Your budget stays on this device."`
     - `removed text "Your budget stays on this device."`
     - `removed other "Open design system"`
     - `removed button "Open design system" testid="settings-open-design-system"`
     - 14 more
8. ✓ `expect.toBeVisible` `getByTestId("ds-badge")` (464ms, video 0:07) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 7 at `com.budgetlens.offline / Design system`
9. ✓ `expect.toBeVisible` `getByTestId("ds-amount-income")` (458ms, video 0:08) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 8 at `com.budgetlens.offline / Design system`
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-expense")` (460ms, video 0:08) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `expect.toBeVisible` `getByTestId("ds-amount-total")` (452ms, video 0:09) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 10 at `com.budgetlens.offline / Design system`
12. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (462ms, video 0:09) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 11 at `com.budgetlens.offline / Design system`
13. ✓ `expect.toBeVisible` `getByTestId("ds-secondary-button")` (459ms, video 0:10) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 12 at `com.budgetlens.offline / Design system`
14. ✓ `expect.toBeVisible` `getByTestId("ds-toggle")` (461ms, video 0:10) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 13 at `com.budgetlens.offline / Design system`
15. ✓ `expect.toBeVisible` `getByTestId("ds-segmented")` (464ms, video 0:11) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 14 at `com.budgetlens.offline / Design system`
16. ✓ `expect.toBeVisible` `getByTestId("ds-progress")` (465ms, video 0:11) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 15 at `com.budgetlens.offline / Design system`
17. ✓ `expect.toBeVisible` `getByTestId("ds-progress-over")` (459ms, video 0:12) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 16 at `com.budgetlens.offline / Design system`
18. ✓ `app.screenshot` `design-system-light` (1.0s, video 0:12) — `e2e/design-system.e2e.ts:42`
   - [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/001-design-system-light.png`
19. ✓ `device.setAppearance` `light` (205ms, video 0:13) — `e2e/design-system.e2e.ts:44`

## Evidence

- [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/001-design-system-light.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a1591a-222d-7f44-bb4a-955f309fa263` · the whole run is in `report.json`</sub>
