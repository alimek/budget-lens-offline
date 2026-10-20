# ✓ discloses the update check and installation ID in Settings

`e2e/privacy.e2e.ts` · target `ios` · passed · 8.3s

Ran on: platform `ios` · device `BudgetLens-CI`

## Steps

1. ✓ `app.open` (1.9s, video 0:00) — `e2e/privacy.e2e.ts:10`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (1.9s, video 0:01) — `e2e/privacy.e2e.ts:11`
   - expect passed after 2 reads in 1.9s: no node (0 matches) -&gt; at 1869ms default states (1 match)
   - screen: 29 nodes at `com.budgetlens.offline / Overview`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (800ms, video 0:03) — `e2e/privacy.e2e.ts:14`
   - tap tab "Settings" (800ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline / Overview`
4. ✓ `expect.toBeVisible` `getByTestId("settings-privacy-updates")` (149ms, video 0:04) — `e2e/privacy.e2e.ts:17`
   - screen: 20 changes since step 3 at `com.budgetlens.offline / Settings`, 31 nodes
     - `added navigation testid="Settings"`
     - `added text "Settings"`
     - `added other testid="screen-settings"`
     - `added other testid="settings-privacy"`
     - `added text "Privacy"`
     - `added text "Privacy"`
     - `added text "Your budget data stays on this device and is never sent anywhere. The only connection the app makes is a check for app updates with Expo, the update service. Each check sends a random ins…`
     - `added text "Your budget data stays on this device and is never sent anywhere. The only connection the app makes is a check for app updates with Expo, the update service. Each check sends a random ins…`
     - `added button "Open design system" testid="settings-open-design-system"`
     - `added tab "Overview" testid="tab-overview"`
     - `added tab "Settings" testid="tab-settings" [selected]`
     - `removed navigation testid="Overview"`
     - 8 more
5. ✓ `expect.toBeVisible` `getByText("Your budget data stays on this device and is never sent anywhere. The only connection the app makes is a check for app updates with Expo, the update service. Each check sends a random installation ID that stays the same until yo…` (138ms, video 0:04) — `e2e/privacy.e2e.ts:18`
   - screen: unchanged since step 4 at `com.budgetlens.offline / Settings`
6. ✓ `app.screenshot` `settings-privacy` (657ms, video 0:04) — `e2e/privacy.e2e.ts:19`
   - [screenshot](attempt-1/screenshots/001-settings-privacy.png) `.e2e/ios/results/privacy-discloses-the-update-check-and-88eb6f66b83366bd/attempt-1/screenshots/001-settings-privacy.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-settings-privacy.png) `.e2e/ios/results/privacy-discloses-the-update-check-and-88eb6f66b83366bd/attempt-1/screenshots/001-settings-privacy.png`
- [video](attempt-1/video/video.mp4) `.e2e/ios/results/privacy-discloses-the-update-check-and-88eb6f66b83366bd/attempt-1/video/video.mp4`

<sub>e2e 0.21.2 · run `01a15a7b-09a8-75ca-8541-7caf2df8e582` · the whole run is in `report.json`</sub>
