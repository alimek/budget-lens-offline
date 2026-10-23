import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import { type Fixtures, openShowcase, settle } from "./support/showcase";

const inputIds = [
  "ds-text-field",
  "ds-amount-field",
  "ds-secure-field",
  "ds-picker",
  "ds-date-picker",
];

/**
 * An entry of the screen, read where the scroll brings it. The screen keeps readable what lies near the screen,
 * so an entry left behind above the viewport is out of the tree again, and nothing is read after being scrolled
 * past (#82).
 */
async function reach(screen: Fixtures["screen"], testID: string) {
  const field = screen.getByTestId(testID);
  await screen.scrollUntilVisible(field);
  await expect(field).toBeVisible();
  return field;
}

/**
 * The same, lifted one bounded way up the page, so that the line under an entry is on the screen as well: the
 * engine stops its own scroll the moment the entry appears, which is often at the very bottom edge, where nothing
 * below it is shown. The drag goes along the right margin, since at the left edge Android takes it for the back
 * gesture and over a field it could be taken for the field's own.
 */
async function reachUpperHalf(screen: Fixtures["screen"], testID: string) {
  const field = await reach(screen, testID);
  const page = await screen.getByTestId("screen-design-system").boundingBox();
  if (page !== null) {
    const x = page.x + page.width - 24;
    await screen.swipe({
      from: { x, y: page.y + page.height * 0.8 },
      to: { x, y: page.y + page.height * 0.5 },
      duration: 900,
    });
    await settle(400);
  }
  return field;
}

test("labels the inputs", async (fixtures) => {
  // Arrange
  const { screen, platform } = fixtures;
  await openShowcase(fixtures);
  // Any non-empty accessible name: tests never select by translated labels. Compose text fields keep their label
  // in a child text node that TalkBack reads with the field but the snapshot does not count as the name (see the
  // UIAutomator dump in #182), so on Android only the date field is checked by name.
  const named = platform === "ios" ? inputIds : ["ds-date-picker"];

  // Act / Assert: every input is on the screen and reads as one, each where the scroll brings it.
  for (const id of inputIds) {
    const field = await reach(screen, id);
    if (named.includes(id)) await expect(field).toHaveAccessibleName(/\S/);
  }
});

test("validates the amount field", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openShowcase(fixtures);
  const amount = await reachUpperHalf(screen, "ds-amount-field");
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

test("steps the interval stepper one month at a time", async (fixtures) => {
  // Arrange
  const { app, screen, platform } = fixtures;
  await openShowcase(fixtures);
  const value = await reach(screen, "ds-stepper");

  // Assert: on iOS the number lives in the label of the system stepper and its +/- buttons are the system's own,
  // so the control showing is what is checked there. On Android the stepper is composed by hand and every part of
  // it is the app's: the number is an outlined field between two step buttons of 48 dp (#63).
  if (platform === "ios") {
    await expect(value).toBeVisible();
    await app.screenshot("stepper");
    return;
  }
  await expect(value).toHaveValue("3");

  // Act / Assert: one step each way, and the bounds stop it.
  await screen.getByTestId("ds-stepper-increase").tap();
  await expect(value).toHaveValue("4");
  await screen.getByTestId("ds-stepper-decrease").tap();
  await screen.getByTestId("ds-stepper-decrease").tap();
  await expect(value).toHaveValue("2");
  await app.screenshot("stepper");
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
