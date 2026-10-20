# ✓ shows the design system components in light mode

`e2e/design-system.e2e.ts` · target `ios` · passed · 39.4s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `device.setAppearance` `light` (192ms, video 0:00) — `e2e/design-system.e2e.ts:23`
2. ✓ `app.open` (1.8s, video 0:00) — `e2e/support/showcase.ts:9`
3. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.3s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 6 reads in 2.3s: no node (0 matches) x5 -&gt; at 2271ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("tab-settings")` (791ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (791ms)
   - screen: unchanged since step 3 at `com.budgetlens.offline / Overview`
5. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (802ms, video 0:05) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (802ms)
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
6. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (216ms, video 0:07) — `e2e/design-system.e2e.ts:30`
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
7. ✓ `expect.toBeVisible` `getByTestId("ds-badge")` (205ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 6 at `com.budgetlens.offline / Design system`
8. ✓ `expect.toBeVisible` `getByTestId("ds-amount-income")` (201ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 7 at `com.budgetlens.offline / Design system`
9. ✓ `expect.toBeVisible` `getByTestId("ds-amount-expense")` (205ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 8 at `com.budgetlens.offline / Design system`
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-total")` (203ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (203ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 10 at `com.budgetlens.offline / Design system`
12. ✓ `expect.toBeVisible` `getByTestId("ds-secondary-button")` (205ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 11 at `com.budgetlens.offline / Design system`
13. ✓ `expect.toBeVisible` `getByTestId("ds-toggle")` (210ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 12 at `com.budgetlens.offline / Design system`
14. ✓ `expect.toBeVisible` `getByTestId("ds-segmented")` (208ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 13 at `com.budgetlens.offline / Design system`
15. ✓ `expect.toBeVisible` `getByTestId("ds-progress")` (217ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 14 at `com.budgetlens.offline / Design system`
16. ✓ `expect.toBeVisible` `getByTestId("ds-progress-over")` (207ms, video 0:09) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 15 at `com.budgetlens.offline / Design system`
17. ✓ `app.screenshot` `design-system-light` (724ms, video 0:09) — `e2e/design-system.e2e.ts:31`
   - [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/001-design-system-light.png`
18. ✓ `app.screenshot` `showcase-light-1` (1.7s, video 0:10) — `e2e/support/showcase.ts:197`
   - [screenshot](attempt-1/screenshots/002-showcase-light-1.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/002-showcase-light-1.png`
19. ✓ `screen.scrollUntilVisible` `getByTestId("ds-amount-field")` (3.2s, video 0:12) — `e2e/support/showcase.ts:164`
   - screen: 57 changes since step 16 at `com.budgetlens.offline / Design system`, 46 nodes
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
     - 45 more
20. ✓ `app.screenshot` `showcase-light-2` (755ms, video 0:16) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/003-showcase-light-2.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/003-showcase-light-2.png`
21. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-amounts")` (1.9s, video 0:18) — `e2e/support/showcase.ts:164`
   - screen: 42 changes since step 19 at `com.budgetlens.offline / Design system`, 56 nodes
     - `added other testid="ds-section-amounts"`
     - `added text "AMOUNTS"`
     - `added text "AMOUNTS"`
     - `added text "12 345,67 zł" text="12 345,67 zł" testid="ds-amount-pl"`
     - `added text "12 345,67 zł" text="12 345,67 zł"`
     - `added text "PLN 12,345.67" text="PLN 12,345.67" testid="ds-amount-en"`
     - `added text "PLN 12,345.67" text="PLN 12,345.67"`
     - `added text "−12 345,67 zł" text="−12 345,67 zł" testid="ds-amount-negative"`
     - `added text "−12 345,67 zł" text="−12 345,67 zł"`
     - `added text "PLN 0.00" text="PLN 0.00" testid="ds-amount-zero"`
     - `added text "PLN 0.00" text="PLN 0.00"`
     - `added other testid="ds-section-typography"`
     - 30 more
22. ✓ `app.screenshot` `showcase-light-3` (736ms, video 0:20) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/004-showcase-light-3.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/004-showcase-light-3.png`
23. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-3")` (1.9s, video 0:22) — `e2e/support/showcase.ts:164`
   - screen: 55 changes since step 21 at `com.budgetlens.offline / Design system`, 71 nodes
     - `added other testid="ds-type-title-2"`
     - `added text "title-2"`
     - `added text "title-2"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-title-3"`
     - `added text "title-3"`
     - `added text "title-3"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-headline"`
     - `added text "headline"`
     - 43 more
24. ✓ `app.screenshot` `showcase-light-4` (732ms, video 0:24) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/005-showcase-light-4.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/005-showcase-light-4.png`
25. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-caption")` (1.9s, video 0:26) — `e2e/support/showcase.ts:164`
   - screen: 51 changes since step 23 at `com.budgetlens.offline / Design system`, 84 nodes
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-caption"`
     - `added text "caption"`
     - `added text "caption"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-section-label"`
     - `added text "section-label"`
     - `added text "section-label"`
     - `added text "PROJECTED CLOSING BALANCE"`
     - `added text "PROJECTED CLOSING BALANCE"`
     - 39 more
26. ✓ `app.screenshot` `showcase-light-5` (755ms, video 0:28) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/006-showcase-light-5.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/006-showcase-light-5.png`
27. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-dark")` (1.9s, video 0:30) — `e2e/support/showcase.ts:164`
   - screen: 68 changes since step 25 at `com.budgetlens.offline / Design system`, 82 nodes
     - `added text "primary"`
     - `added text "primary"`
     - `added text "primary-foreground"`
     - `added text "primary-foreground"`
     - `added text "secondary"`
     - `added text "secondary"`
     - `added text "secondary-foreground"`
     - `added text "secondary-foreground"`
     - `added text "muted"`
     - `added text "muted"`
     - `added text "muted-foreground"`
     - `added text "muted-foreground"`
     - 56 more
28. ✓ `app.screenshot` `showcase-light-6` (728ms, video 0:32) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/007-showcase-light-6.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/007-showcase-light-6.png`
29. ✓ `device.setAppearance` `light` (240ms, video 0:33) — `e2e/design-system.e2e.ts:34`

## Evidence

- [screenshot](attempt-1/screenshots/001-design-system-light.png) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/screenshots/001-design-system-light.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-shows-the-design-system-eb3ebf78a848200f/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a83-1563-7d9f-9b7f-3444075e9392` · the whole run is in `report.json`</sub>
