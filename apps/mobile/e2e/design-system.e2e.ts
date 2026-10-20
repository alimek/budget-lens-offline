import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import { captureShowcase, openShowcase } from "./support/showcase";

const componentIds = [
  "ds-card",
  "ds-badge",
  "ds-amount-income",
  "ds-amount-expense",
  "ds-amount-total",
  "ds-primary-button",
  "ds-secondary-button",
  "ds-toggle",
  "ds-segmented",
  "ds-progress",
  "ds-progress-over",
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
      await captureShowcase(fixtures, `showcase-${appearance}`);
    } finally {
      await device.setAppearance("light");
    }
  });
}

test("toggles a labelled switch", async (fixtures) => {
  // Arrange
  const { screen } = fixtures;
  await openShowcase(fixtures);
  const toggle = screen.getByTestId("ds-toggle");
  // Any non-empty accessible name: tests never select by translated labels.
  await expect(toggle).toHaveAccessibleName(/\S/);
  await expect(toggle).toBeChecked({ checked: false });

  // Act
  await toggle.tap();

  // Assert
  await expect(toggle).toBeChecked();
});

test("labels budget progress and states over budget in text", async (fixtures) => {
  // Arrange
  const { screen } = fixtures;

  // Act
  await openShowcase(fixtures);

  // Assert
  await expect(screen.getByTestId("ds-progress")).toHaveAccessibleName(/\S/);
  await expect(screen.getByTestId("ds-progress-over")).toHaveAccessibleName(/\S/);
  await expect(screen.getByTestId("ds-progress-status")).toBeVisible();
  await expect(screen.getByTestId("ds-progress-over-status")).toBeVisible();
});

test("shows the type scale", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openShowcase(fixtures);

  // Act
  await screen.scrollUntilVisible(screen.getByTestId("ds-type-section-label"));

  // Assert
  for (const id of ["ds-type-footnote", "ds-type-caption", "ds-type-section-label"]) {
    await expect(screen.getByTestId(id)).toBeVisible();
  }
  await app.screenshot("design-system-typography");
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
