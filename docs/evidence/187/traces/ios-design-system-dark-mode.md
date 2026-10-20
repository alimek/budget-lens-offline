# ✓ shows the design system components in dark mode

`e2e/design-system.e2e.ts` · target `ios` · passed · 39.6s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `device.setAppearance` `dark` (185ms, video 0:00) — `e2e/design-system.e2e.ts:23`
2. ✓ `app.open` (1.8s, video 0:00) — `e2e/support/showcase.ts:9`
3. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.3s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 6 reads in 2.3s: no node (0 matches) x5 -&gt; at 2329ms default states (1 match)
   - screen: 28 nodes at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("tab-settings")` (801ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (801ms)
   - screen: 1 change since step 3 at `com.budgetlens.offline / Overview`, 29 nodes
     - `added button "Savings" testid="overview-open-savings"`
5. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (813ms, video 0:05) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (812ms)
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
6. ✓ `expect.toBeVisible` `getByTestId("ds-card")` (220ms, video 0:07) — `e2e/design-system.e2e.ts:30`
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
7. ✓ `expect.toBeVisible` `getByTestId("ds-badge")` (207ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 6 at `com.budgetlens.offline / Design system`
8. ✓ `expect.toBeVisible` `getByTestId("ds-amount-income")` (208ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 7 at `com.budgetlens.offline / Design system`
9. ✓ `expect.toBeVisible` `getByTestId("ds-amount-expense")` (204ms, video 0:07) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 8 at `com.budgetlens.offline / Design system`
10. ✓ `expect.toBeVisible` `getByTestId("ds-amount-total")` (206ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 9 at `com.budgetlens.offline / Design system`
11. ✓ `expect.toBeVisible` `getByTestId("ds-primary-button")` (206ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 10 at `com.budgetlens.offline / Design system`
12. ✓ `expect.toBeVisible` `getByTestId("ds-secondary-button")` (208ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 11 at `com.budgetlens.offline / Design system`
13. ✓ `expect.toBeVisible` `getByTestId("ds-toggle")` (203ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 12 at `com.budgetlens.offline / Design system`
14. ✓ `expect.toBeVisible` `getByTestId("ds-segmented")` (207ms, video 0:08) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 13 at `com.budgetlens.offline / Design system`
15. ✓ `expect.toBeVisible` `getByTestId("ds-progress")` (203ms, video 0:09) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 14 at `com.budgetlens.offline / Design system`
16. ✓ `expect.toBeVisible` `getByTestId("ds-progress-over")` (200ms, video 0:09) — `e2e/design-system.e2e.ts:30`
   - screen: unchanged since step 15 at `com.budgetlens.offline / Design system`
17. ✓ `app.screenshot` `design-system-dark` (727ms, video 0:09) — `e2e/design-system.e2e.ts:31`
   - [screenshot](attempt-1/screenshots/001-design-system-dark.png) `.e2e/ios/results/design-system-shows-the-design-system-0a6154121e00ffe0/attempt-1/screenshots/001-design-system-dark.png`
18. ✓ `app.screenshot` `showcase-dark-1` (706ms, video 0:10) — `e2e/support/showcase.ts:197`
   - [screenshot](attempt-1/screenshots/002-showcase-dark-1.png) `.e2e/ios/results/design-system-shows-the-design-system-0a6154121e00ffe0/attempt-1/screenshots/002-showcase-dark-1.png`
19. ✓ `screen.scrollUntilVisible` `getByTestId("ds-amount-field")` (2.1s, video 0:11) — `e2e/support/showcase.ts:164`
   - screen: 34 changes since step 16 at `com.budgetlens.offline / Design system`, 49 nodes
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
     - 22 more
20. ✓ `app.screenshot` `showcase-dark-2` (760ms, video 0:14) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/003-showcase-dark-2.png) `.e2e/ios/results/design-system-shows-the-design-system-0a6154121e00ffe0/attempt-1/screenshots/003-showcase-dark-2.png`
21. ✓ `screen.scrollUntilVisible` `getByTestId("ds-overlay-result")` (2.8s, video 0:16) — `e2e/support/showcase.ts:164`
   - screen: 55 changes since step 19 at `com.budgetlens.offline / Design system`, 52 nodes
     - `added pop-up-button "More actions" testid="ds-menu"`
     - `added button`
     - `added text "More actions"`
     - `added image "More" testid="ellipsis.circle"`
     - `added text "Last action: none" testid="ds-overlay-result"`
     - `added text "Last action: none"`
     - `added other testid="ds-section-lists"`
     - `added text "LISTS"`
     - `added text "LISTS"`
     - `added button "Open list example" testid="ds-open-list"`
     - `added other testid="ds-section-amounts"`
     - `added text "AMOUNTS"`
     - 43 more
22. ✓ `app.screenshot` `showcase-dark-3` (772ms, video 0:19) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/004-showcase-dark-3.png) `.e2e/ios/results/design-system-shows-the-design-system-0a6154121e00ffe0/attempt-1/screenshots/004-showcase-dark-3.png`
23. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-1")` (1.9s, video 0:21) — `e2e/support/showcase.ts:164`
   - screen: 61 changes since step 21 at `com.budgetlens.offline / Design system`, 71 nodes
     - `added other testid="ds-type-title-1"`
     - `added text "title-1"`
     - `added text "title-1"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-title-2"`
     - `added text "title-2"`
     - `added text "title-2"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-title-3"`
     - `added text "title-3"`
     - 49 more
24. ✓ `app.screenshot` `showcase-dark-4` (734ms, video 0:23) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/005-showcase-dark-4.png) `.e2e/ios/results/design-system-shows-the-design-system-0a6154121e00ffe0/attempt-1/screenshots/005-showcase-dark-4.png`
25. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-caption")` (3.0s, video 0:25) — `e2e/support/showcase.ts:164`
   - screen: 79 changes since step 23 at `com.budgetlens.offline / Design system`, 84 nodes
     - `added other testid="ds-type-caption"`
     - `added text "caption"`
     - `added text "caption"`
     - `added other testid="ds-type-section-label"`
     - `added text "section-label"`
     - `added text "section-label"`
     - `added text "PROJECTED CLOSING BALANCE"`
     - `added text "PROJECTED CLOSING BALANCE"`
     - `added other testid="ds-section-colors"`
     - `added text "COLOURS"`
     - `added text "COLOURS"`
     - `added text "Light"`
     - 67 more
26. ✓ `app.screenshot` `showcase-dark-5` (829ms, video 0:28) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/006-showcase-dark-5.png) `.e2e/ios/results/design-system-shows-the-design-system-0a6154121e00ffe0/attempt-1/screenshots/006-showcase-dark-5.png`
27. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-dark")` (1.9s, video 0:30) — `e2e/support/showcase.ts:164`
   - screen: 75 changes since step 25 at `com.budgetlens.offline / Design system`, 75 nodes
     - `added text "expense"`
     - `added text "expense"`
     - `added text "income"`
     - `added text "income"`
     - `added text "border"`
     - `added text "border"`
     - `added text "input"`
     - `added text "input"`
     - `added text "ring"`
     - `added text "ring"`
     - `added text "Dark"`
     - `added text "Dark"`
     - 63 more
28. ✓ `app.screenshot` `showcase-dark-6` (740ms, video 0:32) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/007-showcase-dark-6.png) `.e2e/ios/results/design-system-shows-the-design-system-0a6154121e00ffe0/attempt-1/screenshots/007-showcase-dark-6.png`
29. ✓ `device.setAppearance` `light` (197ms, video 0:33) — `e2e/design-system.e2e.ts:34`

## Evidence

- [screenshot](attempt-1/screenshots/001-design-system-dark.png) `.e2e/ios/results/design-system-shows-the-design-system-0a6154121e00ffe0/attempt-1/screenshots/001-design-system-dark.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-shows-the-design-system-0a6154121e00ffe0/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a83-1563-7d9f-9b7f-3444075e9392` · the whole run is in `report.json`</sub>
