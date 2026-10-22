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
  // UIAutomator dump in #182), so on Android only the date field is checked by name.
  const named = platform === "ios" ? inputIds : ["ds-date-picker"];
  for (const id of named) await expect(screen.getByTestId(id)).toHaveAccessibleName(/\S/);
  const amount = screen.getByTestId("ds-amount-field");
  const amountError = screen.getByTestId("ds-amount-field-error");
  await expect(amountError).toBeVisible();

  // Act / Assert: a valid amount clears the error, three decimals bring it back.
  await amount.fill("12,34");
  await expect(amountError).toHaveCount(0);
  await amount.fill("12,345");
  await expect(amountError).toBeVisible();
  // Captures end each test: on iOS the first gesture right after a capture can be dropped.
  await app.screenshot("inputs-error");
});

test("picks an option from the native picker menu", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openShowcase(fixtures);
  await screen.scrollUntilVisible(screen.getByTestId("ds-date-picker"));
  const picker = screen.getByTestId("ds-picker");
  await picker.tap();
  await expect(screen.getByTestId("ds-picker-yearly")).toBeVisible();

  // Act
  await screen.getByTestId("ds-picker-yearly").tap();

  // Assert: the menu closes and opens again with the new selection.
  await expect(screen.getByTestId("ds-picker-yearly")).toHaveCount(0);
  await picker.tap();
  await expect(screen.getByTestId("ds-picker-yearly")).toBeVisible();
  await app.screenshot("picker-menu");
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
