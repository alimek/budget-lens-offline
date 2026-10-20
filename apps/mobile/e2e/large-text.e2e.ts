import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import { openListExample, openShowcase } from "./support/showcase";

// Needs the system text size raised before the run (docs/testing.md#large-text): Android font scale 2.0,
// iOS accessibility size AX2 (about 200% of the default body size).
const options = {
  skip:
    process.env["E2E_LARGE_TEXT"] !== "1" &&
    "set E2E_LARGE_TEXT=1 after raising the system text size",
};

test("keeps the showcase components readable at 200% text size", options, async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;

  // Act
  await openShowcase(fixtures);

  // Assert
  await expect(screen.getByTestId("ds-card")).toBeVisible();
  // Captures end each test: on iOS the first gesture right after a capture can be dropped.
  await app.screenshot("large-text-components");
});

test("keeps every showcase control reachable at 200% text size", options, async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openShowcase(fixtures);

  // Act / Assert: the page grows with the text; each control is reached by scrolling.
  for (const id of [
    "ds-primary-button",
    "ds-text-field",
    "ds-amount-field",
    "ds-picker",
    "ds-date-picker",
  ]) {
    await screen.scrollUntilVisible(screen.getByTestId(id));
    await expect(screen.getByTestId(id)).toBeVisible();
  }
  await app.screenshot("large-text-inputs");
});

test("keeps the list example usable at 200% text size", options, async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;

  // Act
  await openListExample(fixtures);

  // Assert
  await expect(screen.getByTestId("ds-row-rent")).toBeVisible();
  await app.screenshot("large-text-list");
});
