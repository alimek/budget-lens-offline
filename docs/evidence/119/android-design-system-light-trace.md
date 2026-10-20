# ✓ shows the design system components in light mode

`e2e/design-system.e2e.ts` · target `android` · passed · 7.0s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `device.setAppearance` `light` (26ms) — `e2e/design-system.e2e.ts:34`
2. ✓ `app.open` (1.8s) — `e2e/design-system.e2e.ts:8`
3. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.5s) — `e2e/design-system.e2e.ts:9`
   - expect passed after 7 reads in 1.5s: no node (0 matches) x6 -&gt; at 1522ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("tab-settings")` (300ms) — `e2e/design-system.e2e.ts:10`
   - tap tab "Settings" (300ms)
   - screen: unchanged since step 3 at `com.budgetlens.offline`
5. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (713ms) — `e2e/design-system.e2e.ts:12`
   - tap button (713ms)
   - screen: 18 changes since step 4 at `com.budgetlens.offline`, 51 nodes
     - `added text "Settings"`
     - `added group testid="screen-settings"`
     - `added group testid="settings-open-design-system"`
     - `added text "Open design system"`
     - `added tab "Overview" testid="tab-overview"`
     - `added text "Overview" testid="com.budgetlens.offline:id/navigation_bar_item_small_label_view"`
     - `added tab "Settings" testid="tab-settings" [selected]`
     - `added text "Settings" testid="com.budgetlens.offline:id/navigation_bar_item_large_label_view" [selected]`
     - `removed text "Overview"`
     - `removed group testid="screen-home"`
     - `removed group testid="overview-savings-card"`
     - `removed heading "Savings"`
     - 6 more
6. ✓ `expect.toBeVisible` `getByTestId("screen-design-system")` (817ms) — `e2e/design-system.e2e.ts:13`
   - screen: 62 changes since step 5 at `com.budgetlens.offline`, 73 nodes
     - `added button "Navigate up"`
     - `added text "Design system"`
     - `added group testid="screen-design-system"`
     - `added group testid="ds-section-components"`
     - `added heading "Components"`
     - `added group testid="ds-card"`
     - `added heading "October 2026"`
     - `added text "Opening balance, income and expenses"`
     - `added group testid="ds-badge"`
     - `added text "Changed this month"`
     - `added text "Income"`
     - `added text "+PLN 12,345.67" text="+PLN 12,345.67" testid="ds-amount-income"`
     - 50 more
7. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (76ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 6 at `com.budgetlens.offline`
8. ✓ `expect.toBeVisible` `getByTestId("ds-badge")` (38ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toBeVisible` `getByTestId("ds-amount-income")` (40ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-expense")` (40ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 9 at `com.budgetlens.offline`
11. ✓ `expect.toBeVisible` `getByTestId("ds-amount-total")` (42ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 10 at `com.budgetlens.offline`
12. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (40ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 11 at `com.budgetlens.offline`
13. ✓ `expect.toBeVisible` `getByTestId("ds-secondary-button")` (39ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 12 at `com.budgetlens.offline`
14. ✓ `expect.toBeVisible` `getByTestId("ds-toggle")` (41ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 13 at `com.budgetlens.offline`
15. ✓ `expect.toBeVisible` `getByTestId("ds-segmented")` (43ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 14 at `com.budgetlens.offline`
16. ✓ `expect.toBeVisible` `getByTestId("ds-progress")` (40ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 15 at `com.budgetlens.offline`
17. ✓ `expect.toBeVisible` `getByTestId("ds-progress-over")` (43ms) — `e2e/design-system.e2e.ts:41`
   - screen: unchanged since step 16 at `com.budgetlens.offline`
18. ✓ `app.screenshot` `design-system-light` (1.3s) — `e2e/design-system.e2e.ts:42`
   - [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/001-design-system-light.png`
19. ✓ `device.setAppearance` `light` (23ms) — `e2e/design-system.e2e.ts:44`

## Evidence

- [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/001-design-system-light.png`

<sub>e2e 0.21.2 · run `01a15919-3b0d-750b-890a-a528c00247e2` · the whole run is in `report.json`</sub>
