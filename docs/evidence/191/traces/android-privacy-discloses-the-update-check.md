# ✓ discloses the update check and installation ID in Settings

`e2e/privacy.e2e.ts` · target `android` · passed · 5.9s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.3s) — `e2e/privacy.e2e.ts:10`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.8s) — `e2e/privacy.e2e.ts:11`
   - expect passed after 16 reads in 2.8s: no node (0 matches) x15 -&gt; at 2802ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (303ms) — `e2e/privacy.e2e.ts:14`
   - tap tab "Settings" (303ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `expect.toBeVisible` `getByTestId("settings-privacy-updates")` (92ms) — `e2e/privacy.e2e.ts:18`
   - screen: 21 changes since step 3 at `com.budgetlens.offline`, 54 nodes
     - `added text "Settings"`
     - `added group testid="screen-settings"`
     - `added group testid="settings-privacy"`
     - `added heading "Privacy"`
     - `added text "Your budget data stays on this device and is never sent anywhere. Each time the app starts (store and TestFlight versions), it checks for app updates with Expo, the update service; this i…`
     - `added group testid="settings-open-design-system"`
     - `added text "Open design system"`
     - `added tab "Overview" testid="tab-overview"`
     - `added text "Overview" testid="com.budgetlens.offline:id/navigation_bar_item_small_label_view"`
     - `added tab "Settings" testid="tab-settings" [selected]`
     - `added text "Settings" testid="com.budgetlens.offline:id/navigation_bar_item_large_label_view" [selected]`
     - `removed text "Overview"`
     - 9 more
5. ✓ `expect.toHaveText` `getByTestId("settings-privacy-updates")` (104ms) — `e2e/privacy.e2e.ts:19`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `app.screenshot` `settings-privacy` (1.4s) — `e2e/privacy.e2e.ts:20`
   - [screenshot](attempt-1/screenshots/001-settings-privacy.png) `.e2e/android/results/privacy-discloses-the-update-check-and-32e006fb0e9f38dd/attempt-1/screenshots/001-settings-privacy.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-settings-privacy.png) `.e2e/android/results/privacy-discloses-the-update-check-and-32e006fb0e9f38dd/attempt-1/screenshots/001-settings-privacy.png`

<sub>e2e 0.21.2 · run `01a15a99-0009-75e9-95f4-8a9b4e54e6e7` · the whole run is in `report.json`</sub>
