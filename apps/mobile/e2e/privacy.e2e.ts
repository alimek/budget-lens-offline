import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

// The test devices run in English; the expected text is `privacy.updates` in `src/i18n/locales/en/translation.json` (ADR 0013).
const disclosure =
  "Your budget data stays on this device and is never sent anywhere. Each time the app starts (store and TestFlight versions), it checks for app updates with Expo, the update service; this is the only connection the app makes. Each check sends a random installation ID stored on this device, technical details of the installed version (platform, runtime version, update channel, update IDs) and, after a crash, the error message. Deleting the app removes the ID, but restoring a device backup can bring it back. Expo also sees your IP address. The app does not track you and has no ads or analytics.";

test("discloses the update check and installation ID in Settings", async ({ app, screen }) => {
  // Arrange
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();

  // Act
  await screen.getByTestId("tab-settings").tap();

  // Assert
  const text = screen.getByTestId("settings-privacy-updates");
  await expect(text).toBeVisible();
  await expect(text).toHaveText(disclosure);
  await app.screenshot("settings-privacy");
});
