import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import { openShowcase } from "./support/showcase";

const inputIds = [
  "ds-text-field",
  "ds-amount-field",
  "ds-secure-field",
  "ds-picker",
  "ds-date-picker",
];

test("labels the inputs and validates the amount field", async (fixtures) => {
  // Arrange
  const { app, screen, platform } = fixtures;
  await openShowcase(fixtures);
  await screen.scrollUntilVisible(screen.getByTestId("ds-date-picker"));
  for (const id of inputIds) await expect(screen.getByTestId(id)).toBeVisible();
  // Any non-empty accessible name: tests never select by translated labels. Compose text fields keep their label
  // in a child text node that TalkBack reads with the field but the snapshot does not count as the name (see the
  // UIAutomator dump in docs/evidence/182), so on Android only the date field is checked by name.
  const named = platform === "ios" ? inputIds : ["ds-date-picker"];
  for (const id of named) await expect(screen.getByTestId(id)).toHaveAccessibleName(/\S/);
  await expect(screen.getByTestId("ds-amount-field-error")).toBeVisible();
  await app.screenshot("inputs-error");

  // Act
  await screen.getByTestId("ds-amount-field").fill("12,34");

  // Assert
  await expect(screen.getByTestId("ds-amount-field-error")).toHaveCount(0);
  await app.screenshot("inputs");
});

test("picks an option from the native picker menu", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openShowcase(fixtures);
  await screen.scrollUntilVisible(screen.getByTestId("ds-date-picker"));
  const picker = screen.getByTestId("ds-picker");
  await picker.tap();
  await expect(screen.getByTestId("ds-picker-yearly")).toBeVisible();
  await app.screenshot("picker-menu");

  // Act
  await screen.getByTestId("ds-picker-yearly").tap();

  // Assert
  await expect(screen.getByTestId("ds-picker-yearly")).toHaveCount(0);
  await picker.tap();
  await expect(screen.getByTestId("ds-picker-yearly")).toBeVisible();
});

test("opens the native calendar from the date picker", async (fixtures) => {
  // Arrange
  const { app, screen, platform } = fixtures;
  await openShowcase(fixtures);
  await screen.scrollUntilVisible(screen.getByTestId("ds-date-picker"));

  // Act
  await screen.getByTestId("ds-date-picker").tap();

  // Assert
  // System calendars: the SwiftUI popover has its own identifiers; the M3 dialog shows the month in the
  // device locale (English on the test emulator), not an app string.
  const calendar =
    platform === "ios"
      ? screen.getByTestId("DatePicker.NextMonth")
      : screen.getByText("October 2026");
  await expect(calendar).toBeVisible();
  await app.screenshot("date-picker");
});
