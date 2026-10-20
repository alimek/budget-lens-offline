# ✓ keeps the showcase components readable at 200% text size

`e2e/large-text.e2e.ts` · target `android` · passed · 7.4s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.9s) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.2s) — `e2e/support/showcase.ts:10`
   - expect passed after 5 reads in 1.2s: no node (0 matches) x4 -&gt; at 1225ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (300ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (300ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (527ms) — `e2e/support/showcase.ts:38`
   - tap button (527ms)
   - screen: 18 changes since step 3 at `com.budgetlens.offline`, 51 nodes
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
5. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (122ms) — `e2e/large-text.e2e.ts:21`
   - screen: 58 changes since step 4 at `com.budgetlens.offline`, 69 nodes
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
     - 46 more
6. ✓ `app.screenshot` `large-text-components` (1.3s) — `e2e/large-text.e2e.ts:23`
   - [screenshot](attempt-1/screenshots/001-large-text-components.png) `.e2e/android-large-text/results/large-text-keeps-the-showcase-components-e88d58bcea7a4bc6/attempt-1/screenshots/001-large-text-components.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-components.png) `.e2e/android-large-text/results/large-text-keeps-the-showcase-components-e88d58bcea7a4bc6/attempt-1/screenshots/001-large-text-components.png`

<sub>e2e 0.21.2 · run `01a159b4-47a0-7439-ab4a-020a9afe8511` · the whole run is in `report.json`</sub>
