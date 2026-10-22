import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import { appAlert, nativeButton, openDevScreen, tapUntilVisible } from "./support/showcase";

interface BootScreenCase {
  name: string;
  screen: string;
  /** The controls the screen leaves the user. */
  actions: string[];
}

const bootScreens: BootScreenCase[] = [
  {
    name: "recovery",
    screen: "screen-recovery",
    actions: ["recovery-start-over", "recovery-retry"],
  },
  {
    name: "migration-failed",
    screen: "screen-recovery",
    actions: ["recovery-retry", "recovery-start-over"],
  },
  {
    name: "restore-failed",
    screen: "screen-recovery",
    actions: ["recovery-retry", "recovery-start-over"],
  },
  {
    name: "state-unrecognized",
    screen: "screen-recovery",
    actions: ["recovery-start-over", "recovery-retry"],
  },
  { name: "encryption-unavailable", screen: "screen-encryption-unavailable", actions: [] },
  {
    name: "storage-unreachable",
    screen: "screen-storage-unreachable",
    actions: ["storage-unreachable-retry"],
  },
];

test("starts up to Overview on the encrypted database", async ({ app, screen }) => {
  // Arrange
  const home = screen.getByTestId("screen-home");

  // Act
  await app.open();

  // Assert
  // Reaching Overview means the cipher guard, the key and the migrations all passed (#75).
  await expect(home).toBeVisible();
  await app.screenshot("boot-overview");
});

test("reports an encrypted database and an encrypted pre-migration copy", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await openDevScreen(fixtures, "storage-check", "screen-storage-check");

  // Act
  const database = screen.getByTestId("storage-check-database");
  const copy = screen.getByTestId("storage-check-copy");

  // Assert
  await expect(screen.getByTestId("storage-check-cipher-version")).not.toHaveText(/missing/);
  await expect(database).toHaveText("Database: encrypted");
  await expect(copy).toHaveText("Pre-migration copy: encrypted");
  await app.screenshot("storage-check");
});

for (const boot of bootScreens) {
  test(`shows the ${boot.name} boot screen`, async (fixtures) => {
    // Arrange
    const { app, screen } = fixtures;

    // Act
    await openDevScreen(fixtures, `boot-screen?screen=${boot.name}`, boot.screen);

    // Assert
    for (const action of boot.actions) {
      await expect(screen.getByTestId(action)).toBeVisible();
    }
    await app.screenshot(`boot-screen-${boot.name}`);
  });
}

/**
 * The acceptance criterion of #75 on a device: a real encrypted database file whose key this device no longer
 * has leads to the recovery screen, and "Start over" keeps that file (#34, #60). `/dev/forget-key` is
 * development-only and forgets the stored key; nothing in a release build can do that.
 */
test("recovers from a real unreadable database and keeps its file", async (fixtures) => {
  // Arrange
  const { app, device, screen } = fixtures;
  await openDevScreen(fixtures, "forget-key", "screen-forget-key");
  await expect(screen.getByTestId("forget-key-result")).toHaveText(/key is gone/);

  // Act: a cold start over a file the forgotten key cannot open
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

  // Assert: the budget that could not be opened is still here, still ciphertext, and its key went with it
  await expect(screen.getByTestId("storage-check-kept")).toHaveText(
    /budget-lens\.orphan-\d+\.db encrypted/,
  );
  await expect(screen.getByTestId("storage-check-database")).toHaveText("Database: encrypted");
  await app.screenshot("storage-check-kept-file");
});
