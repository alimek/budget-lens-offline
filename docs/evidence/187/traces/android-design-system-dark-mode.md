# ✓ shows the design system components in dark mode

`e2e/design-system.e2e.ts` · target `android` · passed · 28.6s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `device.setAppearance` `dark` (36ms) — `e2e/design-system.e2e.ts:23`
2. ✓ `app.open` (1.4s) — `e2e/support/showcase.ts:9`
3. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (3.2s) — `e2e/support/showcase.ts:10`
   - expect passed after 20 reads in 3.2s: no node (0 matches) x19 -&gt; at 3195ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("tab-settings")` (243ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (243ms)
   - screen: unchanged since step 3 at `com.budgetlens.offline`
5. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (501ms) — `e2e/support/showcase.ts:38`
   - tap button (501ms)
   - screen: 18 changes since step 4 at `com.budgetlens.offline`, 52 nodes
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
6. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (79ms) — `e2e/design-system.e2e.ts:30`
   - screen: 75 changes since step 5 at `com.budgetlens.offline`, 87 nodes
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
     - 63 more
7. ✓ `expect.toBeVisible` `getByTestId("ds-badge")` (321ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 6 at `com.budgetlens.offline`
8. ✓ `expect.toBeVisible` `getByTestId("ds-amount-income")` (54ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toBeVisible` `getByTestId("ds-amount-expense")` (47ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-total")` (50ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 9 at `com.budgetlens.offline`
11. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (46ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 10 at `com.budgetlens.offline`
12. ✓ `expect.toBeVisible` `getByTestId("ds-secondary-button")` (52ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 11 at `com.budgetlens.offline`
13. ✓ `expect.toBeVisible` `getByTestId("ds-toggle")` (45ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 12 at `com.budgetlens.offline`
14. ✓ `expect.toBeVisible` `getByTestId("ds-segmented")` (48ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 13 at `com.budgetlens.offline`
15. ✓ `expect.toBeVisible` `getByTestId("ds-progress")` (45ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 14 at `com.budgetlens.offline`
16. ✓ `expect.toBeVisible` `getByTestId("ds-progress-over")` (49ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 15 at `com.budgetlens.offline`
17. ✓ `app.screenshot` `design-system-dark` (1.3s) — `e2e/design-system.e2e.ts:31`
   - [screenshot](attempt-1/screenshots/001-design-system-dark.png) `.e2e/android/results/design-system-shows-the-design-system-4a81a54bb495041e/attempt-1/screenshots/001-design-system-dark.png`
18. ✓ `app.screenshot` `showcase-dark-1` (1.4s) — `e2e/support/showcase.ts:167`
   - [screenshot](attempt-1/screenshots/002-showcase-dark-1.png) `.e2e/android/results/design-system-shows-the-design-system-4a81a54bb495041e/attempt-1/screenshots/002-showcase-dark-1.png`
19. ✓ `screen.scrollUntilVisible` `getByTestId("ds-picker")` (1.3s) — `e2e/support/showcase.ts:171`
   - screen: 47 changes since step 16 at `com.budgetlens.offline`, 84 nodes
     - `added text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `added textbox testid="ds-secure-field" value=<secure> purpose=password [secure]`
     - `added text "Recovery secret"`
     - `added textbox "Every month" testid="ds-picker" value="Every month"`
     - `added text "Repeats"`
     - `added combobox`
     - `added button "Due date, Oct 10, 2026" testid="ds-date-picker"`
     - `added textbox "Oct 10, 2026" value="Oct 10, 2026" [disabled]`
     - `added text "Due date"`
     - `added group testid="ds-section-overlays"`
     - `added heading "Overlays"`
     - `added group testid="ds-open-sheet"`
     - 35 more
20. ✓ `app.screenshot` `showcase-dark-2` (1.4s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/003-showcase-dark-2.png) `.e2e/android/results/design-system-shows-the-design-system-4a81a54bb495041e/attempt-1/screenshots/003-showcase-dark-2.png`
21. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-lists")` (1.2s) — `e2e/support/showcase.ts:171`
   - screen: 50 changes since step 19 at `com.budgetlens.offline`, 72 nodes
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
     - 38 more
22. ✓ `app.screenshot` `showcase-dark-3` (1.3s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/004-showcase-dark-3.png) `.e2e/android/results/design-system-shows-the-design-system-4a81a54bb495041e/attempt-1/screenshots/004-showcase-dark-3.png`
23. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-3")` (1.2s) — `e2e/support/showcase.ts:171`
   - screen: 69 changes since step 21 at `com.budgetlens.offline`, 61 nodes
     - `added group testid="ds-type-title-2"`
     - `added text "title-2"`
     - `added heading "Projected closing balance"`
     - `added group testid="ds-type-title-3"`
     - `added text "title-3"`
     - `added heading "Projected closing balance"`
     - `added group testid="ds-type-headline"`
     - `added text "headline"`
     - `added text "Projected closing balance"`
     - `added group testid="ds-type-body"`
     - `added text "body"`
     - `added text "Projected closing balance"`
     - 57 more
24. ✓ `app.screenshot` `showcase-dark-4` (1.3s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/005-showcase-dark-4.png) `.e2e/android/results/design-system-shows-the-design-system-4a81a54bb495041e/attempt-1/screenshots/005-showcase-dark-4.png`
25. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-light")` (1.2s) — `e2e/support/showcase.ts:171`
   - screen: 41 changes since step 23 at `com.budgetlens.offline`, 60 nodes
     - `added text "Light"`
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
     - 29 more
26. ✓ `app.screenshot` `showcase-dark-5` (1.3s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/006-showcase-dark-5.png) `.e2e/android/results/design-system-shows-the-design-system-4a81a54bb495041e/attempt-1/screenshots/006-showcase-dark-5.png`
27. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-dark")` (1.3s) — `e2e/support/showcase.ts:171`
   - screen: 36 changes since step 25 at `com.budgetlens.offline`, 56 nodes
     - `added text "input"`
     - `added text "ring"`
     - `added text "Dark"`
     - `added group testid="ds-swatches-dark"`
     - `added text "primary"`
     - `added text "primary-foreground"`
     - `added text "secondary"`
     - `added text "secondary-foreground"`
     - `added text "muted"`
     - `added text "muted-foreground"`
     - `added text "accent"`
     - `added text "accent-foreground"`
     - 24 more
28. ✓ `app.screenshot` `showcase-dark-6` (1.3s) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/007-showcase-dark-6.png) `.e2e/android/results/design-system-shows-the-design-system-4a81a54bb495041e/attempt-1/screenshots/007-showcase-dark-6.png`
29. ✓ `device.setAppearance` `light` (44ms) — `e2e/design-system.e2e.ts:34`

## Evidence

- [screenshot](attempt-1/screenshots/001-design-system-dark.png) `.e2e/android/results/design-system-shows-the-design-system-4a81a54bb495041e/attempt-1/screenshots/001-design-system-dark.png`

<sub>e2e 0.21.2 · run `01a15a66-5acb-721b-99db-d0468601074d` · the whole run is in `report.json`</sub>
