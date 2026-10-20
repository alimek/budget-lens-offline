# ✓ captures the whole showcase at 200% text size

`e2e/large-text.e2e.ts` · target `ios` · passed · 1m 6s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.8s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.2s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 5 reads in 2.2s: no node (0 matches) x4 -&gt; at 2225ms default states (1 match)
   - screen: 28 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (793ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (793ms)
   - screen: 1 change since step 2 at `com.budgetlens.offline / Overview`, 29 nodes
     - `added button "Savings" testid="overview-open-savings"`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (800ms, video 0:05) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (800ms)
   - screen: 15 changes since step 3 at `com.budgetlens.offline / Settings`, 26 nodes
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
5. ✓ `app.screenshot` `large-text-showcase-1` (736ms, video 0:06) — `e2e/support/showcase.ts:197`
   - [screenshot](attempt-1/screenshots/001-large-text-showcase-1.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/001-large-text-showcase-1.png`
6. ✓ `screen.scrollUntilVisible` `getByTestId("ds-toggle")` (3.2s, video 0:07) — `e2e/support/showcase.ts:164`
   - screen: 46 changes since step 4 at `com.budgetlens.offline / Design system`, 32 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added other testid="ds-card"`
     - `added text "+PLN 12,345.67" text="+PLN 12,345.67" testid="ds-amount-income"`
     - `added text "+PLN 12,345.67" text="+PLN 12,345.67"`
     - `added text "Expenses"`
     - `added text "Expenses"`
     - `added text "−PLN 8,450.00" text="−PLN 8,450.00" testid="ds-amount-expense"`
     - `added text "−PLN 8,450.00" text="−PLN 8,450.00"`
     - 34 more
7. ✓ `app.screenshot` `large-text-showcase-2` (747ms, video 0:11) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/002-large-text-showcase-2.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/002-large-text-showcase-2.png`
8. ✓ `screen.scrollUntilVisible` `getByTestId("ds-progress-over")` (1.9s, video 0:12) — `e2e/support/showcase.ts:164`
   - screen: 21 changes since step 6 at `com.budgetlens.offline / Design system`, 33 nodes
     - `added other "Groceries" testid="ds-progress" value="60% used"`
     - `added text "60% used" testid="ds-progress-status"`
     - `added text "60% used"`
     - `added other "Eating out" testid="ds-progress-over" value="Over budget: 120% used"`
     - `added text "Over budget: 120% used" testid="ds-progress-over-status"`
     - `added text "Over budget: 120% used"`
     - `added other testid="ds-section-inputs"`
     - `added text "INPUTS"`
     - `added text "INPUTS"`
     - `added other "Vertical scroll bar, 12 pages" value="15%"`
     - `added other "Vertical scroll bar, 12 pages" value="15%"`
     - `removed text "+PLN 12,345.67" text="+PLN 12,345.67" testid="ds-amount-income"`
     - 9 more
9. ✓ `app.screenshot` `large-text-showcase-3` (749ms, video 0:15) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/003-large-text-showcase-3.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/003-large-text-showcase-3.png`
10. ✓ `screen.scrollUntilVisible` `getByTestId("ds-amount-field")` (3.0s, video 0:16) — `e2e/support/showcase.ts:164`
   - screen: 27 changes since step 8 at `com.budgetlens.offline / Design system`, 28 nodes
     - `added textbox "Name" testid="ds-text-field" value="e.g. Rent"`
     - `added textbox "Amount" testid="ds-amount-field" value="12,345"`
     - `added text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `added text "Use at most 2 decimal places"`
     - `added textbox "Recovery secret" testid="ds-secure-field" value=<secure> purpose=password [secure]`
     - `added button "Repeats, Every month" testid="ds-picker"`
     - `added text "Every month"`
     - `added date-picker "Due date, Due date" testid="ds-date-picker"`
     - `added button "Date Picker" value="10 Oct 2026"`
     - `added other "Vertical scroll bar, 12 pages" value="24%"`
     - `added other "Vertical scroll bar, 12 pages" value="24%"`
     - `removed other testid="ds-card"`
     - 15 more
11. ✓ `app.screenshot` `large-text-showcase-4` (755ms, video 0:19) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/004-large-text-showcase-4.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/004-large-text-showcase-4.png`
12. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-overlays")` (1.9s, video 0:21) — `e2e/support/showcase.ts:164`
   - screen: 23 changes since step 10 at `com.budgetlens.offline / Design system`, 31 nodes
     - `added other testid="ds-section-overlays"`
     - `added text "OVERLAYS"`
     - `added text "OVERLAYS"`
     - `added button "Show details" testid="ds-open-sheet"`
     - `added button "Close month" testid="ds-open-alert"`
     - `added pop-up-button "More actions" testid="ds-menu"`
     - `added button`
     - `added text "More actions"`
     - `added image "More" testid="ellipsis.circle"`
     - `added text "Last action: none" testid="ds-overlay-result"`
     - `added text "Last action: none"`
     - `added other "Vertical scroll bar, 12 pages" value="30%"`
     - 11 more
13. ✓ `app.screenshot` `large-text-showcase-5` (763ms, video 0:23) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/005-large-text-showcase-5.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/005-large-text-showcase-5.png`
14. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-lists")` (1.9s, video 0:24) — `e2e/support/showcase.ts:164`
   - screen: 25 changes since step 12 at `com.budgetlens.offline / Design system`, 36 nodes
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
     - `added text "PLN 12,345.67" text="PLN 12,345.67"`
     - `added text "−12 345,67 zł" text="−12 345,67 zł" testid="ds-amount-negative"`
     - 13 more
15. ✓ `app.screenshot` `large-text-showcase-6` (734ms, video 0:27) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/006-large-text-showcase-6.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/006-large-text-showcase-6.png`
16. ✓ `screen.scrollUntilVisible` `getByTestId("ds-amount-zero")` (1.9s, video 0:28) — `e2e/support/showcase.ts:164`
   - screen: 25 changes since step 14 at `com.budgetlens.offline / Design system`, 35 nodes
     - `added text "PLN 0.00" text="PLN 0.00" testid="ds-amount-zero"`
     - `added text "PLN 0.00" text="PLN 0.00"`
     - `added other testid="ds-section-typography"`
     - `added text "TYPOGRAPHY"`
     - `added text "TYPOGRAPHY"`
     - `added other testid="ds-type-display"`
     - `added text "display"`
     - `added text "display"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other "Vertical scroll bar, 12 pages" value="42%"`
     - `added other "Vertical scroll bar, 12 pages" value="42%"`
     - 13 more
17. ✓ `app.screenshot` `large-text-showcase-7` (735ms, video 0:31) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/007-large-text-showcase-7.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/007-large-text-showcase-7.png`
18. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-1")` (1.9s, video 0:32) — `e2e/support/showcase.ts:164`
   - screen: 19 changes since step 16 at `com.budgetlens.offline / Design system`, 30 nodes
     - `added other testid="ds-type-title-1"`
     - `added text "title-1"`
     - `added text "title-1"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other "Vertical scroll bar, 12 pages" value="47%"`
     - `added other "Vertical scroll bar, 12 pages" value="47%"`
     - `removed other testid="ds-section-lists"`
     - `removed text "LISTS"`
     - `removed text "LISTS"`
     - `removed button "Open list example" testid="ds-open-list"`
     - `removed text "AMOUNTS"`
     - 7 more
19. ✓ `app.screenshot` `large-text-showcase-8` (757ms, video 0:34) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/008-large-text-showcase-8.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/008-large-text-showcase-8.png`
20. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-3")` (1.9s, video 0:35) — `e2e/support/showcase.ts:164`
   - screen: 21 changes since step 18 at `com.budgetlens.offline / Design system`, 29 nodes
     - `added other testid="ds-type-title-2"`
     - `added text "title-2"`
     - `added text "title-2"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-title-3"`
     - `added text "title-3"`
     - `added text "title-3"`
     - `added other "Vertical scroll bar, 12 pages" value="53%"`
     - `added other "Vertical scroll bar, 12 pages" value="53%"`
     - `removed other testid="ds-section-amounts"`
     - `removed text "−12 345,67 zł" text="−12 345,67 zł" testid="ds-amount-negative"`
     - 9 more
21. ✓ `app.screenshot` `large-text-showcase-9` (741ms, video 0:38) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/009-large-text-showcase-9.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/009-large-text-showcase-9.png`
22. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-body")` (3.0s, video 0:39) — `e2e/support/showcase.ts:164`
   - screen: 27 changes since step 20 at `com.budgetlens.offline / Design system`, 38 nodes
     - `added other testid="ds-type-headline"`
     - `added text "headline"`
     - `added text "headline"`
     - `added other testid="ds-type-body"`
     - `added text "body"`
     - `added text "body"`
     - `added other testid="ds-type-callout"`
     - `added text "callout"`
     - `added text "callout"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-subheadline"`
     - 15 more
23. ✓ `app.screenshot` `large-text-showcase-10` (746ms, video 0:42) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/010-large-text-showcase-10.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/010-large-text-showcase-10.png`
24. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-caption")` (1.9s, video 0:43) — `e2e/support/showcase.ts:164`
   - screen: 20 changes since step 22 at `com.budgetlens.offline / Design system`, 44 nodes
     - `added other testid="ds-type-footnote"`
     - `added text "footnote"`
     - `added text "footnote"`
     - `added other testid="ds-type-caption"`
     - `added text "caption"`
     - `added text "caption"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-section-label"`
     - `added text "section-label"`
     - `added text "section-label"`
     - `added other "Vertical scroll bar, 12 pages" value="70%"`
     - 8 more
25. ✓ `app.screenshot` `large-text-showcase-11` (756ms, video 0:46) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/011-large-text-showcase-11.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/011-large-text-showcase-11.png`
26. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-colors")` (2.1s, video 0:47) — `e2e/support/showcase.ts:164`
   - screen: 33 changes since step 24 at `com.budgetlens.offline / Design system`, 43 nodes
     - `added text "PROJECTED CLOSING BALANCE"`
     - `added text "PROJECTED CLOSING BALANCE"`
     - `added other testid="ds-section-colors"`
     - `added text "COLOURS"`
     - `added text "COLOURS"`
     - `added text "Light"`
     - `added text "Light"`
     - `added other testid="ds-swatches-light"`
     - `added text "background"`
     - `added text "background"`
     - `added text "foreground"`
     - `added text "foreground"`
     - 21 more
27. ✓ `app.screenshot` `large-text-showcase-12` (743ms, video 0:49) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/012-large-text-showcase-12.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/012-large-text-showcase-12.png`
28. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-dark")` (5.2s, video 0:51) — `e2e/support/showcase.ts:164`
   - screen: 64 changes since step 26 at `com.budgetlens.offline / Design system`, 57 nodes
     - `added text "secondary-foreground"`
     - `added text "secondary-foreground"`
     - `added text "muted"`
     - `added text "muted"`
     - `added text "muted-foreground"`
     - `added text "muted-foreground"`
     - `added text "accent"`
     - `added text "accent"`
     - `added text "accent-foreground"`
     - `added text "accent-foreground"`
     - `added text "destructive"`
     - `added text "destructive"`
     - 52 more
29. ✓ `app.screenshot` `large-text-showcase-13` (738ms, video 0:56) — `e2e/support/showcase.ts:204`
   - [screenshot](attempt-1/screenshots/013-large-text-showcase-13.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/013-large-text-showcase-13.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-showcase-1.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/001-large-text-showcase-1.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a8c-ce94-739f-addd-918c837fd60e` · the whole run is in `report.json`</sub>
