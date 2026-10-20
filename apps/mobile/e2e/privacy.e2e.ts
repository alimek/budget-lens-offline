import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

// English on the test devices; `privacy.updates` in `src/i18n/locales/en.json` (ADR 0013).
const disclosure =
  "Your budget data stays on this device and is never sent anywhere. The only connection the app makes is a check for app updates with Expo, the update service. Each check sends a random installation ID that stays the same until you delete the app, technical details of the installed version (platform, runtime version, update channel, update IDs) and, after a crash, the error message. Expo also sees your IP address. The app does not track you and has no ads or analytics.";

test("discloses the update check and installation ID in Settings", async ({ app, screen }) => {
  // Arrange
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();

  // Act
  await screen.getByTestId("tab-settings").tap();

  // Assert
  await expect(screen.getByTestId("settings-privacy-updates")).toBeVisible();
  await expect(screen.getByText(disclosure)).toBeVisible();
  await app.screenshot("settings-privacy");
});
