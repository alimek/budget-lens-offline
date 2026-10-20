# ✓ shows the design system components in light mode

`e2e/design-system.e2e.ts` · target `android` · passed · 28.6s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `device.setAppearance` `light` (21ms) — `e2e/design-system.e2e.ts:23`
2. ✓ `app.open` (1.3s) — `e2e/support/showcase.ts:9`
3. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (3.2s) — `e2e/support/showcase.ts:10`
   - expect passed after 22 reads in 3.2s: no node (0 matches) x21 -&gt; at 3163ms default states (1 match)
   - screen: 54 nodes at `com.budgetlens.offline`
4. ✓ `locator.tap` `getByTestId("tab-settings")` (244ms) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (244ms)
   - screen: unchanged since step 3 at `com.budgetlens.offline`
5. ✓ `locator.tap` `getByTestId("settings-open-design-system") >> getByRole("button")` (500ms) — `e2e/support/showcase.ts:38`
   - tap button (500ms)
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
6. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (88ms) — `e2e/design-system.e2e.ts:30`
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
7. ✓ `expect.toBeVisible` `getByTestId("ds-badge")` (331ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 6 at `com.budgetlens.offline`
8. ✓ `expect.toBeVisible` `getByTestId("ds-amount-income")` (54ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 7 at `com.budgetlens.offline`
9. ✓ `expect.toBeVisible` `getByTestId("ds-amount-expense")` (57ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 8 at `com.budgetlens.offline`
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-total")` (50ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 9 at `com.budgetlens.offline`
11. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (54ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 10 at `com.budgetlens.offline`
12. ✓ `expect.toBeVisible` `getByTestId("ds-secondary-button")` (48ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 11 at `com.budgetlens.offline`
13. ✓ `expect.toBeVisible` `getByTestId("ds-toggle")` (48ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 12 at `com.budgetlens.offline`
14. ✓ `expect.toBeVisible` `getByTestId("ds-segmented")` (48ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 13 at `com.budgetlens.offline`
15. ✓ `expect.toBeVisible` `getByTestId("ds-progress")` (50ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 14 at `com.budgetlens.offline`
16. ✓ `expect.toBeVisible` `getByTestId("ds-progress-over")` (50ms) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 15 at `com.budgetlens.offline`
17. ✓ `app.screenshot` `design-system-light` (1.3s) — `e2e/design-system.e2e.ts:31`
   - [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/001-design-system-light.png`
18. ✓ `app.screenshot` `showcase-light-1` (1.4s) — `e2e/support/showcase.ts:197`
   - [screenshot](attempt-1/screenshots/002-showcase-light-1.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/002-showcase-light-1.png`
19. ✓ `screen.scrollUntilVisible` `getByTestId("ds-picker")` (1.3s) — `e2e/support/showcase.ts:164`
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
20. ✓ `app.screenshot` `showcase-light-2` (1.4s) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/003-showcase-light-2.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/003-showcase-light-2.png`
21. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-lists")` (1.2s) — `e2e/support/showcase.ts:164`
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
22. ✓ `app.screenshot` `showcase-light-3` (1.3s) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/004-showcase-light-3.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/004-showcase-light-3.png`
23. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-3")` (1.2s) — `e2e/support/showcase.ts:164`
   - screen: 67 changes since step 21 at `com.budgetlens.offline`, 59 nodes
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
     - 55 more
24. ✓ `app.screenshot` `showcase-light-4` (1.3s) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/005-showcase-light-4.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/005-showcase-light-4.png`
25. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-colors")` (1.2s) — `e2e/support/showcase.ts:164`
   - screen: 42 changes since step 23 at `com.budgetlens.offline`, 61 nodes
     - `added group testid="ds-section-colors"`
     - `added heading "Colours"`
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
     - 30 more
26. ✓ `app.screenshot` `showcase-light-5` (1.3s) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/006-showcase-light-5.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/006-showcase-light-5.png`
27. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-dark")` (1.2s) — `e2e/support/showcase.ts:164`
   - screen: 37 changes since step 25 at `com.budgetlens.offline`, 56 nodes
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
     - 25 more
28. ✓ `app.screenshot` `showcase-light-6` (1.3s) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/007-showcase-light-6.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/007-showcase-light-6.png`
29. ✓ `device.setAppearance` `light` (28ms) — `e2e/design-system.e2e.ts:34`

## Evidence

- [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/android/results/design-system-shows-the-design-system-e0ac9b22f72f964a/attempt-1/screenshots/001-design-system-light.png`

<sub>e2e 0.21.2 · run `01a15a89-0509-7b87-ba1d-1351665f42eb` · the whole run is in `report.json`</sub>
