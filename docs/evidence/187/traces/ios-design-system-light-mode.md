# ✓ shows the design system components in light mode

`e2e/design-system.e2e.ts` · target `ios` · passed · 39.1s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `device.setAppearance` `light` (186ms, video 0:00) — `e2e/design-system.e2e.ts:23`
2. ✓ `app.open` (1.8s, video 0:00) — `e2e/support/showcase.ts:9`
3. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.3s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 6 reads in 2.3s: no node (0 matches) x5 -&gt; at 2341ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("tab-settings")` (793ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (792ms)
   - screen: unchanged since step 3 at `com.budgetlens.offline / Overview`
5. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (799ms, video 0:05) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (799ms)
   - screen: 15 changes since step 4 at `com.budgetlens.offline / Settings`, 26 nodes
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
6. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (229ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: 67 changes since step 5 at `com.budgetlens.offline / Design system`, 53 nodes
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
     - 55 more
7. ✓ `expect.toBeVisible` `getByTestId("ds-badge")` (209ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 6 at `com.budgetlens.offline / Design system`
8. ✓ `expect.toBeVisible` `getByTestId("ds-amount-income")` (212ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 7 at `com.budgetlens.offline / Design system`
9. ✓ `expect.toBeVisible` `getByTestId("ds-amount-expense")` (212ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 8 at `com.budgetlens.offline / Design system`
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-total")` (207ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (219ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 10 at `com.budgetlens.offline / Design system`
12. ✓ `expect.toBeVisible` `getByTestId("ds-secondary-button")` (210ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 11 at `com.budgetlens.offline / Design system`
13. ✓ `expect.toBeVisible` `getByTestId("ds-toggle")` (210ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 12 at `com.budgetlens.offline / Design system`
14. ✓ `expect.toBeVisible` `getByTestId("ds-segmented")` (212ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 13 at `com.budgetlens.offline / Design system`
15. ✓ `expect.toBeVisible` `getByTestId("ds-progress")` (205ms, video 0:09) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 14 at `com.budgetlens.offline / Design system`
16. ✓ `expect.toBeVisible` `getByTestId("ds-progress-over")` (210ms, video 0:09) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 15 at `com.budgetlens.offline / Design system`
17. ✓ `app.screenshot` `design-system-light` (729ms, video 0:09) — `e2e/design-system.e2e.ts:31`
   - [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/001-design-system-light.png`
18. ✓ `app.screenshot` `showcase-light-1` (720ms, video 0:10) — `e2e/support/showcase.ts:167`
   - [screenshot](attempt-1/screenshots/002-showcase-light-1.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/002-showcase-light-1.png`
19. ✓ `screen.scrollUntilVisible` `getByTestId("ds-amount-field")` (2.1s, video 0:11) — `e2e/support/showcase.ts:171`
   - screen: 43 changes since step 16 at `com.budgetlens.offline / Design system`, 48 nodes
     - `added textbox "Amount" testid="ds-amount-field" value="12,345"`
     - `added text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `added text "Use at most 2 decimal places"`
     - `added textbox "Recovery secret" testid="ds-secure-field" value=<secure> purpose=password [secure]`
     - `added button "Repeats, Every month" testid="ds-picker"`
     - `added text "Every month"`
     - `added date-picker "Due date, Due date" testid="ds-date-picker"`
     - `added button "Date Picker" value="10 Oct 2026"`
     - `added other testid="ds-section-overlays"`
     - `added text "OVERLAYS"`
     - `added text "OVERLAYS"`
     - `added button "Show details" testid="ds-open-sheet"`
     - 31 more
20. ✓ `app.screenshot` `showcase-light-2` (751ms, video 0:14) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/003-showcase-light-2.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/003-showcase-light-2.png`
21. ✓ `screen.scrollUntilVisible` `getByTestId("ds-overlay-result")` (1.9s, video 0:16) — `e2e/support/showcase.ts:171`
   - screen: 42 changes since step 19 at `com.budgetlens.offline / Design system`, 50 nodes
     - `added text "Last action: none" testid="ds-overlay-result"`
     - `added text "Last action: none"`
     - `added other testid="ds-section-lists"`
     - `added text "LISTS"`
     - `added text "LISTS"`
     - `added button "Open list example" testid="ds-open-list"`
     - `added other testid="ds-section-amounts"`
     - `added text "AMOUNTS"`
     - `added text "AMOUNTS"`
     - `added text "12 345,67 zł" text="12 345,67 zł" testid="ds-amount-pl"`
     - `added text "12 345,67 zł" text="12 345,67 zł"`
     - `added text "PLN 12,345.67" text="PLN 12,345.67" testid="ds-amount-en"`
     - 30 more
22. ✓ `app.screenshot` `showcase-light-3` (755ms, video 0:18) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/004-showcase-light-3.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/004-showcase-light-3.png`
23. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-1")` (1.9s, video 0:20) — `e2e/support/showcase.ts:171`
   - screen: 40 changes since step 21 at `com.budgetlens.offline / Design system`, 64 nodes
     - `added other testid="ds-type-display"`
     - `added text "display"`
     - `added text "display"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-title-1"`
     - `added text "title-1"`
     - `added text "title-1"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-title-2"`
     - `added text "title-2"`
     - 28 more
24. ✓ `app.screenshot` `showcase-light-4` (757ms, video 0:22) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/005-showcase-light-4.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/005-showcase-light-4.png`
25. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-body")` (1.9s, video 0:24) — `e2e/support/showcase.ts:171`
   - screen: 63 changes since step 23 at `com.budgetlens.offline / Design system`, 77 nodes
     - `added other testid="ds-type-body"`
     - `added text "body"`
     - `added text "body"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-callout"`
     - `added text "callout"`
     - `added text "callout"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-subheadline"`
     - `added text "subheadline"`
     - 51 more
26. ✓ `app.screenshot` `showcase-light-5` (737ms, video 0:26) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/006-showcase-light-5.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/006-showcase-light-5.png`
27. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-dark")` (3.5s, video 0:28) — `e2e/support/showcase.ts:171`
   - screen: 126 changes since step 25 at `com.budgetlens.offline / Design system`, 77 nodes
     - `added text "background"`
     - `added text "background"`
     - `added text "foreground"`
     - `added text "foreground"`
     - `added text "card"`
     - `added text "card"`
     - `added text "card-foreground"`
     - `added text "card-foreground"`
     - `added text "popover"`
     - `added text "popover"`
     - `added text "popover-foreground"`
     - `added text "popover-foreground"`
     - 114 more
28. ✓ `app.screenshot` `showcase-light-6` (739ms, video 0:32) — `e2e/support/showcase.ts:174`
   - [screenshot](attempt-1/screenshots/007-showcase-light-6.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/007-showcase-light-6.png`
29. ✓ `device.setAppearance` `light` (193ms, video 0:33) — `e2e/design-system.e2e.ts:34`

## Evidence

- [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/001-design-system-light.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a60-4611-79ab-9b58-ab346949ac12` · the whole run is in `report.json`</sub>
