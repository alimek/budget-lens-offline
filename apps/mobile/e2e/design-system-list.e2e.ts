import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import {
  appAlert,
  describedNode,
  nativeButton,
  openListExample,
  settle,
  swipeRowLeft,
  tapUntilVisible,
} from "./support/showcase";

test("shows grouped transaction rows and toggles the paid state", async (fixtures) => {
  // Arrange
  const { app, screen, platform } = fixtures;
  await openListExample(fixtures);
  for (const id of ["ds-list", "ds-list-expenses", "ds-list-income", "ds-row-salary"]) {
    await expect(screen.getByTestId(id)).toBeVisible();
  }
  const rent = screen.getByTestId("ds-row-rent");
  // Named "Paid: <title>" on both platforms. On Android Compose puts the row's content description on a child node
  // of the checkbox (the row also has text), so the name is checked there.
  await expect(platform === "ios" ? rent : rent.getByRole("group")).toHaveAccessibleName(/\S/);
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

test("deletes a row with its swipe action after confirming", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openListExample(fixtures);
  const rent = screen.getByTestId("ds-row-rent");
  const remove = nativeButton(fixtures, "ds-row-rent-delete");
  await swipeRowLeft(screen, rent);
  // Named "<action>: <title>" ("Delete: Rent"); on Android on the child node Compose creates for the description.
  await expect(describedNode(fixtures, "ds-row-rent-delete")).toHaveAccessibleName(/\S/);
  await app.screenshot("list-swipe");

  // Act
  const { alert, confirm } = appAlert(fixtures, "ds-delete-alert", "Delete “Rent”?");
  await tapUntilVisible(remove, alert);
  await settle();
  await confirm.tap();

  // Assert
  await expect(rent).toHaveCount(0);
  await expect(screen.getByTestId("ds-row-internet")).toBeVisible();
});

test("opens the edit sheet from a swipe action", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openListExample(fixtures);
  await swipeRowLeft(screen, screen.getByTestId("ds-row-internet"));

  // Act
  await tapUntilVisible(
    nativeButton(fixtures, "ds-row-internet-edit"),
    screen.getByTestId("ds-edit-sheet"),
  );

  // Assert
  await settle();
  await app.screenshot("list-edit-sheet");
});
