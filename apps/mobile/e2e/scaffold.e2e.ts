import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

test("opens Overview as the home screen", async ({ app, screen }) => {
  // Arrange
  const home = screen.getByTestId("screen-home");

  // Act
  await app.open();

  // Assert
  await expect(home).toBeVisible();
  await app.screenshot("overview");
});

for (const tab of ["month", "forecast", "items", "settings"]) {
  test(`opens the ${tab} tab`, async ({ app, screen }) => {
    // Arrange
    await app.open();
    await expect(screen.getByTestId("screen-home")).toBeVisible();

    // Act
    await screen.getByTestId(`tab-${tab}`).tap();

    // Assert
    await expect(screen.getByTestId(`screen-${tab}`)).toBeVisible();
    await app.screenshot(tab);
  });
}

test("opens Savings inside Overview", async ({ app, screen, platform }) => {
  // Arrange
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  const openSavings = screen.getByTestId("overview-open-savings");
  // Expo UI on Android puts the test ID on a wrapper around the native button; iOS puts it on the button.
  const savingsButton = platform === "android" ? openSavings.getByRole("button") : openSavings;

  // Act
  await savingsButton.tap();

  // Assert
  await expect(screen.getByTestId("screen-savings")).toBeVisible();
  await app.screenshot("savings");
});
