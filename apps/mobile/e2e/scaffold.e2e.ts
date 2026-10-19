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
  });
}

test("opens Savings inside Overview", async ({ app, screen }) => {
  // Arrange
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();

  // Act
  await screen.getByTestId("overview-open-savings").tap();

  // Assert
  await expect(screen.getByTestId("screen-savings")).toBeVisible();
  await app.screenshot("savings");
});
