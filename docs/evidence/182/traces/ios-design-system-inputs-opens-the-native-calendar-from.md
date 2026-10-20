# ✓ opens the native calendar from the date picker

`e2e/design-system-inputs.e2e.ts` · target `ios` · passed · 14.1s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/support/showcase.ts:9`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.6s, video 0:01) — `e2e/support/showcase.ts:10`
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (770ms, video 0:03) — `e2e/support/showcase.ts:38`
   - tap tab "Settings" (770ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `locator.tap` `getByTestId("settings-open-design-system")` (790ms, video 0:04) — `e2e/support/showcase.ts:38`
   - tap button "Open design system" (790ms)
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
5. ✓ `screen.scrollUntilVisible` `getByTestId("ds-date-picker")` (2.1s, video 0:06) — `e2e/design-system-inputs.e2e.ts:60`
   - screen: 60 changes since step 4 at `com.budgetlens.offline / Design system`, 46 nodes
     - `added navigation testid="Design system"`
     - `added button "Back" testid="BackButton"`
     - `added text "Design system"`
     - `added other testid="screen-design-system"`
     - `added other testid="ds-section-components"`
     - `added button "Add item" testid="ds-primary-button"`
     - `added button "Close month" testid="ds-secondary-button"`
     - `added switch "Privacy mode" testid="ds-toggle" value="0"`
     - `added text "Privacy mode"`
     - `added switch value="0"`
     - `added tablist testid="ds-segmented"`
     - `added tab "Only this month" [selected]`
     - 48 more
6. ✓ `locator.tap` `getByTestId("ds-date-picker")` (1.4s, video 0:08) — `e2e/design-system-inputs.e2e.ts:63`
   - tap date-picker "Due date, Due date" (1.4s)
   - screen: unchanged since step 5 at `com.budgetlens.offline / Design system`
7. ✓ `expect.toBeVisible` `getByTestId("DatePicker.NextMonth")` (260ms, video 0:09) — `e2e/design-system-inputs.e2e.ts:72`
   - screen: 71 changes since step 6 at `com.budgetlens.offline / Design system`, 115 nodes
     - `added other "Date Picker" value="10 Oct 2026"`
     - `added button "Month" value="October 2026"`
     - `added button "Previous Month" testid="DatePicker.PreviousMonth"`
     - `added button "Next Month" testid="DatePicker.NextMonth"`
     - `added button "Show year picker" testid="DatePicker.Show" value="October 2026"`
     - `added text "October 2026"`
     - `added collection-view`
     - `added listitem "Thursday, 1 October"`
     - `added text "1"`
     - `added listitem "Friday, 2 October"`
     - `added text "2"`
     - `added listitem "Saturday, 3 October"`
     - 59 more
8. ✓ `app.screenshot` `date-picker` (789ms, video 0:10) — `e2e/design-system-inputs.e2e.ts:73`
   - [screenshot](attempt-1/screenshots/001-date-picker.png) `.e2e/ios/results/design-system-inputs-opens-the-native-calendar-from-96b4782120d9f107/attempt-1/screenshots/001-date-picker.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-date-picker.png) `.e2e/ios/results/design-system-inputs-opens-the-native-calendar-from-96b4782120d9f107/attempt-1/screenshots/001-date-picker.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/design-system-inputs-opens-the-native-calendar-from-96b4782120d9f107/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a159cb-b68f-7040-977a-1fa30cd7f30b` · the whole run is in `report.json`</sub>
