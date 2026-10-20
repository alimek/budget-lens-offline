import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import {
  appAlert,
  type Fixtures,
  nativeButton,
  openShowcase,
  settle,
  tapUntilVisible,
} from "./support/showcase";

/** Opens the showcase and scrolls to the overlay section; returns the last-action text. */
async function openOverlays(fixtures: Fixtures) {
  const { screen } = fixtures;
  await openShowcase(fixtures);
  const result = screen.getByTestId("ds-overlay-result");
  await screen.scrollUntilVisible(result);
  await settle();
  return result;
}

test("opens the sheet and closes it with its button", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openOverlays(fixtures);
  const sheet = screen.getByTestId("ds-sheet");
  const open = nativeButton(fixtures, "ds-open-sheet");

  // Act
  await tapUntilVisible(open, sheet);
  await settle();
  await nativeButton(fixtures, "ds-sheet-done").tap();

  // Assert
  await expect(sheet).toHaveCount(0);
  await tapUntilVisible(open, sheet);
  await settle();
  await app.screenshot("sheet");
});

test("confirms the alert", async (fixtures) => {
  // Arrange
  const { app } = fixtures;
  const result = await openOverlays(fixtures);
  const before = await result.textContent();
  const { alert, confirm } = appAlert(fixtures, "ds-alert", "Close October?");
  await tapUntilVisible(nativeButton(fixtures, "ds-open-alert"), alert);
  await settle();
  await app.screenshot("alert");

  // Act
  await confirm.tap();

  // Assert
  await expect(alert).toHaveCount(0);
  await expect(result).not.toHaveText(before ?? "");
});

test("picks an action from the menu", async (fixtures) => {
  // Arrange
  const { app, screen, platform } = fixtures;
  const result = await openOverlays(fixtures);
  const before = await result.textContent();
  // Any non-empty accessible name. On Android the Compose button keeps its label in a child text node that TalkBack
  // reads with it, as with the other Compose buttons.
  if (platform === "ios") await expect(screen.getByTestId("ds-menu")).toHaveAccessibleName(/\S/);
  const duplicate = screen.getByTestId("ds-menu-duplicate");
  await tapUntilVisible(nativeButton(fixtures, "ds-menu"), duplicate);
  await settle();
  await app.screenshot("menu");

  // Act
  await duplicate.tap();

  // Assert
  await expect(duplicate).toHaveCount(0);
  await expect(result).not.toHaveText(before ?? "");
});
