// Booting the plain SQLite database (#242): a normal open, the files this app owns, and the one recovery screen
// over a real database file that cannot be opened. The test devices run in English (docs/testing.md).
import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import { appAlert, nativeButton, openDevScreen, tapUntilVisible } from "./support/showcase";

test("starts up to Overview on the plain database", async ({ app, screen }) => {
  // Arrange
  const home = screen.getByTestId("screen-home");

  // Act
  await app.open();

  // Assert
  // Reaching Overview means the database opened and its schema is current (#242).
  await expect(home).toBeVisible();
  await app.screenshot("boot-overview");
});

test("reports a plain SQLite database and its pre-migration copy", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openDevScreen(fixtures, "storage-check", "screen-storage-check");

  // Act
  const database = screen.getByTestId("storage-check-database");
  const copy = screen.getByTestId("storage-check-copy");

  // Assert
  // The live file is plain SQLite, and so is the copy the check just took through the same steps a migration
  // takes (#35 §2, #242): neither of them is ciphertext and neither is a file this app did not write.
  await expect(database).toHaveText("Database: SQLite file");
  await expect(copy).toHaveText("Pre-migration copy: SQLite file");
  await app.screenshot("storage-check");
});

test("shows the one recovery screen", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;

  // Act
  await openDevScreen(fixtures, "boot-screen", "screen-recovery");

  // Assert: a retry and a start-over, and nothing else (#242)
  await expect(screen.getByTestId("recovery-retry")).toBeVisible();
  await expect(screen.getByTestId("recovery-start-over")).toBeVisible();
  await expect(screen.getByTestId("recovery-keeps-file")).toBeVisible();
  await app.screenshot("boot-screen-recovery");
});

/**
 * The acceptance criterion of #242 on a device: a real database file this build cannot open leads to the recovery
 * screen, and "Start over" keeps that file. `/dev/damage-database` is development-only; nothing in a release
 * build can make a database unreadable like this.
 */
test("recovers from a real unreadable database and keeps its file", async (fixtures) => {
  // Arrange
  const { app, device, screen } = fixtures;
  await openDevScreen(fixtures, "damage-database", "screen-damage-database");
  await expect(screen.getByTestId("damage-database-result")).toHaveText(/no longer readable/);

  // Act: a cold start over a file that is not a database any more
  await device.closeApp();
  await app.open();

  // Assert
  await expect(screen.getByTestId("screen-recovery")).toBeVisible();
  await app.screenshot("recovery-unreadable-database");
  const { confirm } = appAlert(fixtures, "recovery-start-over-alert", "Start over?", "Start over");
  await tapUntilVisible(nativeButton(fixtures, "recovery-start-over"), confirm);

  // Act: start over, and look at what the device kept
  await confirm.tap();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await openDevScreen(fixtures, "storage-check", "screen-storage-check");

  // Assert: the budget that could not be opened is still here, and it is still a plain SQLite file
  await expect(screen.getByTestId("storage-check-kept")).toHaveText(
    /budget-lens\.orphan-\d+\.db SQLite file/,
  );
  await expect(screen.getByTestId("storage-check-database")).toHaveText("Database: SQLite file");
  await app.screenshot("storage-check-kept-file");
});
