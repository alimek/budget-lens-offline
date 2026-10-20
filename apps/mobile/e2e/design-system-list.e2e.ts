import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import { openListExample, tapUntilVisible } from "./support/showcase";

test("shows grouped transaction rows and toggles the paid state", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openListExample(fixtures);
  for (const id of ["ds-list", "ds-list-expenses", "ds-list-income", "ds-row-salary"]) {
    await expect(screen.getByTestId(id)).toBeVisible();
  }
  const rent = screen.getByTestId("ds-row-rent");
  // Named "Paid: <title>" on both platforms (the iOS status button, the Android row checkbox).
  await expect(rent).toHaveAccessibleName(/\S/);
  await expect(rent).toBeChecked({ checked: false });
  await expect(screen.getByTestId("ds-row-internet")).toBeChecked();

  // Act
  await rent.tap();

  // Assert
  await expect(rent).toBeChecked();
  // After the taps: on iOS a tap into the SwiftUI list right after a capture can be dropped.
  await app.screenshot("list");
});

test("adds a row with the add button", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openListExample(fixtures);
  const add = screen.getByTestId("ds-add-button");
  await expect(add).toHaveAccessibleName(/\S/);

  // Act / Assert
  await tapUntilVisible(add, screen.getByTestId("ds-row-new-1"));
  await app.screenshot("list-added");
});
