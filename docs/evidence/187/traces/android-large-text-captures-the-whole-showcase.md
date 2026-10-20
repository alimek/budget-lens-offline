# ✓ captures the whole showcase at 200% text size

`e2e/large-text.e2e.ts` · target `android` · passed · 33.0s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.3s) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (3.2s) — `e2e/support/showcase.ts:10`
   - expect passed after 21 reads in 3.2s: no node (0 matches) x20 -&gt; at 3210ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (255ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (255ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (501ms) — `e2e/support/showcase.ts:38`
   - tap button (501ms)
   - screen: 18 changes since step 3 at `com.budgetlens.offline`, 52 nodes
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
5. ✓ `app.screenshot` `large-text-showcase-1` (1.4s) — `e2e/support/showcase.ts:167`
   - [screenshot](attempt-1/screenshots/001-large-text-showcase-1.png) `.e2e/android-large-text/results/large-text-captures-the-whole-showcase-at-9353a99368ba0caf/attempt-1/screenshots/001-large-text-showcase-1.png`
6. ✓ `screen.scrollUntilVisible` `getByTestId("ds-progress-over")` (1.3s) — `e2e/support/showcase.ts:171`
   - screen: 70 changes since step 4 at `com.budgetlens.offline`, 82 nodes
     - `added button "Navigate up"`
     - `added text "Design system"`
     - `added group testid="screen-design-system"`
     - `added group testid="ds-section-components"`
     - `added group testid="ds-card"`
     - `added text "PLN 3,895.67" text="PLN 3,895.67" testid="ds-amount-total"`
     - `added group testid="ds-primary-button"`
     - `added text "Add item"`
     - `added group testid="ds-secondary-button"`
     - `added text "Close month"`
     - `added button`
     - `added switch "Privacy mode" testid="ds-toggle"`
     - 58 more
7. ✓ `app.screenshot` `large-text-showcase-2` (1.5s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/002-large-text-showcase-2.png) `.e2e/android-large-text/results/large-text-captures-the-whole-showcase-at-9353a99368ba0caf/attempt-1/screenshots/002-large-text-showcase-2.png`
8. ✓ `screen.scrollUntilVisible` `getByTestId("ds-picker")` (1.2s) — `e2e/support/showcase.ts:171`
   - screen: 40 changes since step 6 at `com.budgetlens.offline`, 72 nodes
     - `added textbox "Every month" testid="ds-picker" value="Every month"`
     - `added text "Repeats"`
     - `added combobox`
     - `added button "Due date, Oct 10, 2026" testid="ds-date-picker"`
     - `added textbox "Oct 10, 2026" value="Oct 10, 2026" [disabled]`
     - `added text "Due date"`
     - `added group testid="ds-section-overlays"`
     - `added heading "Overlays"`
     - `added group testid="ds-open-sheet"`
     - `added text "Show details"`
     - `added group testid="ds-open-alert"`
     - `added group testid="ds-menu"`
     - 28 more
9. ✓ `app.screenshot` `large-text-showcase-3` (1.4s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/003-large-text-showcase-3.png) `.e2e/android-large-text/results/large-text-captures-the-whole-showcase-at-9353a99368ba0caf/attempt-1/screenshots/003-large-text-showcase-3.png`
10. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-lists")` (1.2s) — `e2e/support/showcase.ts:171`
   - screen: 43 changes since step 8 at `com.budgetlens.offline`, 61 nodes
     - `added group testid="ds-section-lists"`
     - `added heading "Lists"`
     - `added group testid="ds-open-list"`
     - `added text "Open list example"`
     - `added button`
     - `added group testid="ds-section-amounts"`
     - `added heading "Amounts"`
     - `added text "12 345,67 zł" text="12 345,67 zł" testid="ds-amount-pl"`
     - `added text "PLN 12,345.67" text="PLN 12,345.67" testid="ds-amount-en"`
     - `added text "−12 345,67 zł" text="−12 345,67 zł" testid="ds-amount-negative"`
     - `added text "PLN 0.00" text="PLN 0.00" testid="ds-amount-zero"`
     - `added group testid="ds-section-typography"`
     - 31 more
11. ✓ `app.screenshot` `large-text-showcase-4` (1.3s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/004-large-text-showcase-4.png) `.e2e/android-large-text/results/large-text-captures-the-whole-showcase-at-9353a99368ba0caf/attempt-1/screenshots/004-large-text-showcase-4.png`
12. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-1")` (1.2s) — `e2e/support/showcase.ts:171`
   - screen: 45 changes since step 10 at `com.budgetlens.offline`, 44 nodes
     - `added group testid="ds-type-title-1"`
     - `added text "title-1"`
     - `added heading "Projected closing balance"`
     - `added group testid="ds-type-title-2"`
     - `added text "title-2"`
     - `added heading "Projected closing balance"`
     - `added group testid="ds-type-title-3"`
     - `added text "title-3"`
     - `added heading "Projected closing balance"`
     - `added group testid="ds-type-headline"`
     - `added text "headline"`
     - `added text "Projected closing balance"`
     - 33 more
13. ✓ `app.screenshot` `large-text-showcase-5` (1.3s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/005-large-text-showcase-5.png) `.e2e/android-large-text/results/large-text-captures-the-whole-showcase-at-9353a99368ba0caf/attempt-1/screenshots/005-large-text-showcase-5.png`
14. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-subheadline")` (1.2s) — `e2e/support/showcase.ts:171`
   - screen: 29 changes since step 12 at `com.budgetlens.offline`, 51 nodes
     - `added text "Projected closing balance"`
     - `added group testid="ds-type-callout"`
     - `added text "callout"`
     - `added text "Projected closing balance"`
     - `added group testid="ds-type-subheadline"`
     - `added text "subheadline"`
     - `added text "Projected closing balance"`
     - `added group testid="ds-type-footnote"`
     - `added text "footnote"`
     - `added text "Projected closing balance"`
     - `added group testid="ds-type-caption"`
     - `added text "caption"`
     - 17 more
15. ✓ `app.screenshot` `large-text-showcase-6` (1.3s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/006-large-text-showcase-6.png) `.e2e/android-large-text/results/large-text-captures-the-whole-showcase-at-9353a99368ba0caf/attempt-1/screenshots/006-large-text-showcase-6.png`
16. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-light")` (1.2s) — `e2e/support/showcase.ts:171`
   - screen: 34 changes since step 14 at `com.budgetlens.offline`, 49 nodes
     - `added group testid="ds-swatches-light"`
     - `added text "background"`
     - `added text "foreground"`
     - `added text "card"`
     - `added text "card-foreground"`
     - `added text "popover"`
     - `added text "popover-foreground"`
     - `added text "primary"`
     - `added text "primary-foreground"`
     - `added text "secondary"`
     - `added text "secondary-foreground"`
     - `added text "muted"`
     - 22 more
17. ✓ `app.screenshot` `large-text-showcase-7` (1.3s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/007-large-text-showcase-7.png) `.e2e/android-large-text/results/large-text-captures-the-whole-showcase-at-9353a99368ba0caf/attempt-1/screenshots/007-large-text-showcase-7.png`
18. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-dark")` (1.3s) — `e2e/support/showcase.ts:171`
   - screen: 21 changes since step 16 at `com.budgetlens.offline`, 46 nodes
     - `added text "expense"`
     - `added text "income"`
     - `added text "border"`
     - `added text "input"`
     - `added text "ring"`
     - `added text "Dark"`
     - `added group testid="ds-swatches-dark"`
     - `added text "card-foreground"`
     - `added text "popover-foreground"`
     - `removed group testid="ds-section-typography"`
     - `removed group testid="ds-type-footnote"`
     - `removed text "footnote"`
     - 9 more
19. ✓ `app.screenshot` `large-text-showcase-8` (1.3s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/008-large-text-showcase-8.png) `.e2e/android-large-text/results/large-text-captures-the-whole-showcase-at-9353a99368ba0caf/attempt-1/screenshots/008-large-text-showcase-8.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-showcase-1.png) `.e2e/android-large-text/results/large-text-captures-the-whole-showcase-at-9353a99368ba0caf/attempt-1/screenshots/001-large-text-showcase-1.png`

<sub>e2e 0.21.2 · run `01a15a6b-d87a-7e87-a206-52de6f217819` · the whole run is in `report.json`</sub>
