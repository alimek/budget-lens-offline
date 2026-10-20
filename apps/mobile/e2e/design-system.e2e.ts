import { type Device, test } from "@e2e-dev/mobile";
import { expect, type TestFixtures } from "e2e";

type Fixtures = TestFixtures & { device: Device };

/** Opens the dev-only showcase from Settings; Expo UI on Android puts the test ID on a wrapper. */
async function openShowcase({ app, screen, platform }: Fixtures) {
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await screen.getByTestId("tab-settings").tap();
  const open = screen.getByTestId("settings-open-design-system");
  await (platform === "android" ? open.getByRole("button") : open).tap();
  await expect(screen.getByTestId("screen-design-system")).toBeVisible();
}

const componentIds = [
  "ds-card",
  "ds-badge",
  "ds-amount-income",
  "ds-amount-expense",
  "ds-amount-total",
  "ds-primary-button",
  "ds-secondary-button",
];

for (const appearance of ["light", "dark"] as const) {
  test(`shows the design system components in ${appearance} mode`, async (fixtures) => {
    // Arrange
    const { app, device, screen } = fixtures;
    await device.setAppearance(appearance);

    try {
      // Act
      await openShowcase(fixtures);

      // Assert
      for (const id of componentIds) await expect(screen.getByTestId(id)).toBeVisible();
      await app.screenshot(`design-system-${appearance}`);
    } finally {
      await device.setAppearance("light");
    }
  });
}

test("shows the native controls of the design system", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openShowcase(fixtures);

  // Act
  await screen.scrollUntilVisible(screen.getByTestId("ds-progress-over"));

  // Assert
  for (const id of ["ds-toggle", "ds-segmented", "ds-progress", "ds-progress-over"]) {
    await expect(screen.getByTestId(id)).toBeVisible();
  }
  await app.screenshot("design-system-controls");
});

test("shows the colour tokens of both appearances", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openShowcase(fixtures);

  // Act
  await screen.scrollUntilVisible(screen.getByTestId("ds-swatches-dark"));

  // Assert
  await expect(screen.getByTestId("ds-swatches-dark")).toBeVisible();
  await expect(screen.getByTestId("ds-section-colors")).toBeVisible();
  await app.screenshot("design-system-tokens");
});
