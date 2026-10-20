# ✓ captures the whole showcase at 200% text size

`e2e/large-text.e2e.ts` · target `ios` · passed · 1m 5s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.8s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.2s, video 0:01) — `e2e/support/showcase.ts:10`
   - expect passed after 5 reads in 2.2s: no node (0 matches) x4 -&gt; at 2210ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (803ms, video 0:03) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (803ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (795ms, video 0:05) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (795ms)
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
5. ✓ `app.screenshot` `large-text-showcase-1` (721ms, video 0:06) — `e2e/support/showcase.ts:193`
   - [screenshot](attempt-1/screenshots/001-large-text-showcase-1.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/001-large-text-showcase-1.png`
6. ✓ `screen.scrollUntilVisible` `getByTestId("ds-toggle")` (3.8s, video 0:07) — `e2e/support/showcase.ts:169`
   - screen: 48 changes since step 4 at `com.budgetlens.offline / Design system`, 34 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added other testid="ds-card"`
     - `added text "−PLN 8,450.00" text="−PLN 8,450.00" testid="ds-amount-expense"`
     - `added text "−PLN 8,450.00" text="−PLN 8,450.00"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added text "PLN 3,895.67" text="PLN 3,895.67" testid="ds-amount-total"`
     - `added text "PLN 3,895.67" text="PLN 3,895.67"`
     - 36 more
7. ✓ `app.screenshot` `large-text-showcase-2` (745ms, video 0:12) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/002-large-text-showcase-2.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/002-large-text-showcase-2.png`
8. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-inputs")` (1.9s, video 0:13) — `e2e/support/showcase.ts:169`
   - screen: 16 changes since step 6 at `com.budgetlens.offline / Design system`, 32 nodes
     - `added other testid="ds-section-inputs"`
     - `added text "INPUTS"`
     - `added text "INPUTS"`
     - `added textbox "Name" testid="ds-text-field" value="e.g. Rent"`
     - `added textbox "Amount" testid="ds-amount-field" value="12,345"`
     - `added other "Vertical scroll bar, 12 pages" value="17%"`
     - `added other "Vertical scroll bar, 12 pages" value="17%"`
     - `removed other testid="ds-card"`
     - `removed text "−PLN 8,450.00" text="−PLN 8,450.00" testid="ds-amount-expense"`
     - `removed text "−PLN 8,450.00" text="−PLN 8,450.00"`
     - `removed text "Projected closing balance"`
     - `removed text "Projected closing balance"`
     - 4 more
9. ✓ `app.screenshot` `large-text-showcase-3` (750ms, video 0:15) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/003-large-text-showcase-3.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/003-large-text-showcase-3.png`
10. ✓ `screen.scrollUntilVisible` `getByTestId("ds-picker")` (1.9s, video 0:17) — `e2e/support/showcase.ts:169`
   - screen: 22 changes since step 8 at `com.budgetlens.offline / Design system`, 28 nodes
     - `added text "Use at most 2 decimal places" testid="ds-amount-field-error"`
     - `added text "Use at most 2 decimal places"`
     - `added textbox "Recovery secret" testid="ds-secure-field" value=<secure> purpose=password [secure]`
     - `added button "Repeats, Every month" testid="ds-picker"`
     - `added text "Every month"`
     - `added date-picker "Due date, Due date" testid="ds-date-picker"`
     - `added button "Date Picker" value="10 Oct 2026"`
     - `added other "Vertical scroll bar, 12 pages" value="23%"`
     - `added other "Vertical scroll bar, 12 pages" value="23%"`
     - `removed button "Add item" testid="ds-primary-button"`
     - `removed button "Close month" testid="ds-secondary-button"`
     - `removed switch "Privacy mode" testid="ds-toggle" value="0"`
     - 10 more
11. ✓ `app.screenshot` `large-text-showcase-4` (751ms, video 0:19) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/004-large-text-showcase-4.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/004-large-text-showcase-4.png`
12. ✓ `screen.scrollUntilVisible` `getByTestId("ds-section-overlays")` (2.0s, video 0:20) — `e2e/support/showcase.ts:169`
   - screen: 20 changes since step 10 at `com.budgetlens.offline / Design system`, 30 nodes
     - `added other testid="ds-section-overlays"`
     - `added text "OVERLAYS"`
     - `added text "OVERLAYS"`
     - `added button "Show details" testid="ds-open-sheet"`
     - `added button "Close month" testid="ds-open-alert"`
     - `added pop-up-button "More actions" testid="ds-menu"`
     - `added button`
     - `added text "More actions"`
     - `added image "More" testid="ellipsis.circle"`
     - `added other "Vertical scroll bar, 12 pages" value="28%"`
     - `added other "Vertical scroll bar, 12 pages" value="28%"`
     - `removed other testid="ds-section-components"`
     - 8 more
13. ✓ `app.screenshot` `large-text-showcase-5` (759ms, video 0:23) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/005-large-text-showcase-5.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/005-large-text-showcase-5.png`
14. ✓ `screen.scrollUntilVisible` `getByTestId("ds-overlay-result")` (3.0s, video 0:24) — `e2e/support/showcase.ts:169`
   - screen: 35 changes since step 12 at `com.budgetlens.offline / Design system`, 39 nodes
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
     - 23 more
15. ✓ `app.screenshot` `large-text-showcase-6` (731ms, video 0:27) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/006-large-text-showcase-6.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/006-large-text-showcase-6.png`
16. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-1")` (3.5s, video 0:29) — `e2e/support/showcase.ts:169`
   - screen: 35 changes since step 14 at `com.budgetlens.offline / Design system`, 28 nodes
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
     - `added other "Vertical scroll bar, 12 pages" value="48%"`
     - `added other "Vertical scroll bar, 12 pages" value="48%"`
     - 23 more
17. ✓ `app.screenshot` `large-text-showcase-7` (738ms, video 0:33) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/007-large-text-showcase-7.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/007-large-text-showcase-7.png`
18. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-title-3")` (4.6s, video 0:34) — `e2e/support/showcase.ts:169`
   - screen: 34 changes since step 16 at `com.budgetlens.offline / Design system`, 36 nodes
     - `added other testid="ds-type-title-2"`
     - `added text "title-2"`
     - `added text "title-2"`
     - `added other testid="ds-type-title-3"`
     - `added text "title-3"`
     - `added text "title-3"`
     - `added other testid="ds-type-headline"`
     - `added text "headline"`
     - `added text "headline"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-body"`
     - 22 more
19. ✓ `app.screenshot` `large-text-showcase-8` (751ms, video 0:40) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/008-large-text-showcase-8.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/008-large-text-showcase-8.png`
20. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-subheadline")` (1.9s, video 0:41) — `e2e/support/showcase.ts:169`
   - screen: 19 changes since step 18 at `com.budgetlens.offline / Design system`, 41 nodes
     - `added other testid="ds-type-subheadline"`
     - `added text "subheadline"`
     - `added text "subheadline"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other testid="ds-type-footnote"`
     - `added text "footnote"`
     - `added text "footnote"`
     - `added text "Projected closing balance"`
     - `added text "Projected closing balance"`
     - `added other "Vertical scroll bar, 12 pages" value="67%"`
     - `added other "Vertical scroll bar, 12 pages" value="67%"`
     - 7 more
21. ✓ `app.screenshot` `large-text-showcase-9` (747ms, video 0:43) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/009-large-text-showcase-9.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/009-large-text-showcase-9.png`
22. ✓ `screen.scrollUntilVisible` `getByTestId("ds-type-caption")` (1.9s, video 0:44) — `e2e/support/showcase.ts:169`
   - screen: 28 changes since step 20 at `com.budgetlens.offline / Design system`, 43 nodes
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
     - 16 more
23. ✓ `app.screenshot` `large-text-showcase-10` (723ms, video 0:47) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/010-large-text-showcase-10.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/010-large-text-showcase-10.png`
24. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-light")` (1.9s, video 0:48) — `e2e/support/showcase.ts:169`
   - screen: 35 changes since step 22 at `com.budgetlens.offline / Design system`, 50 nodes
     - `added other testid="ds-swatches-light"`
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
     - 23 more
25. ✓ `app.screenshot` `large-text-showcase-11` (750ms, video 0:50) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/011-large-text-showcase-11.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/011-large-text-showcase-11.png`
26. ✓ `screen.scrollUntilVisible` `getByTestId("ds-swatches-dark")` (3.6s, video 0:51) — `e2e/support/showcase.ts:169`
   - screen: 47 changes since step 24 at `com.budgetlens.offline / Design system`, 57 nodes
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
     - 35 more
27. ✓ `app.screenshot` `large-text-showcase-12` (735ms, video 0:55) — `e2e/support/showcase.ts:200`
   - [screenshot](attempt-1/screenshots/012-large-text-showcase-12.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/012-large-text-showcase-12.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-large-text-showcase-1.png) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/screenshots/001-large-text-showcase-1.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios-large-text/results/large-text-captures-the-whole-showcase-at-5e2f9b9a5baad72b/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a6f-daab-7e3f-b267-02eb70140788` · the whole run is in `report.json`</sub>
