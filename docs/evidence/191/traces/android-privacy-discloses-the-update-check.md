# ✓ discloses the update check and installation ID in Settings

`e2e/privacy.e2e.ts` · target `android` · passed · 6.0s

Ran on: platform `android` · device `BudgetLens-Android`

## Steps

1. ✓ `app.open` (1.4s) — `e2e/privacy.e2e.ts:10`
2. ✓ `expect.toBeVisible` `getByTestId("screen-home")` (2.6s) — `e2e/privacy.e2e.ts:11`
   - expect passed after 15 reads in 2.6s: no node (0 matches) x14 -&gt; at 2626ms default states (1 match)
   - screen: 53 nodes at `com.budgetlens.offline`
3. ✓ `locator.tap` `getByTestId("tab-settings")` (307ms) — `e2e/privacy.e2e.ts:14`
   - tap tab "Settings" (307ms)
   - screen: unchanged since step 2 at `com.budgetlens.offline`
4. ✓ `expect.toBeVisible` `getByTestId("settings-privacy-updates")` (182ms) — `e2e/privacy.e2e.ts:17`
   - screen: 21 changes since step 3 at `com.budgetlens.offline`, 54 nodes
     - `added text "Settings"`
     - `added group testid="screen-settings"`
     - `added group testid="settings-privacy"`
     - `added heading "Privacy"`
     - `added text "Your budget data stays on this device and is never sent anywhere. The only connection the app makes is a check for app updates with Expo, the update service. Each check sends a random ins…`
     - `added group testid="settings-open-design-system"`
     - `added text "Open design system"`
     - `added tab "Overview" testid="tab-overview"`
     - `added text "Overview" testid="com.budgetlens.offline:id/navigation_bar_item_small_label_view"`
     - `added tab "Settings" testid="tab-settings" [selected]`
     - `added text "Settings" testid="com.budgetlens.offline:id/navigation_bar_item_large_label_view" [selected]`
     - `removed text "Overview"`
     - 9 more
5. ✓ `expect.toBeVisible` `getByText("Your budget data stays on this device and is never sent anywhere. The only connection the app makes is a check for app updates with Expo, the update service. Each check sends a random installation ID that stays the same until yo…` (133ms) — `e2e/privacy.e2e.ts:18`
   - screen: unchanged since step 4 at `com.budgetlens.offline`
6. ✓ `app.screenshot` `settings-privacy` (1.4s) — `e2e/privacy.e2e.ts:19`
   - [screenshot](attempt-1/screenshots/001-settings-privacy.png) `.e2e/android/results/privacy-discloses-the-update-check-and-32e006fb0e9f38dd/attempt-1/screenshots/001-settings-privacy.png`

## Evidence

- [screenshot](attempt-1/screenshots/001-settings-privacy.png) `.e2e/android/results/privacy-discloses-the-update-check-and-32e006fb0e9f38dd/attempt-1/screenshots/001-settings-privacy.png`

<sub>e2e 0.21.2 · run `01a15a7e-c431-7c74-8783-ad461b42db95` · the whole run is in `report.json`</sub>
