import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import { appAlert, nativeButton, openDevScreen, settle, tapUntilVisible } from "./support/showcase";

interface BootScreenCase {
  name: string;
  screen: string;
  /** Prefix of the steps and status line of this screen (#60 test IDs). */
  prefix: string;
  /** The controls the screen leaves the user, in the order they are stacked. */
  actions: string[];
}

const bootScreens: BootScreenCase[] = [
  {
    name: "recovery",
    screen: "screen-recovery",
    prefix: "recovery",
    actions: ["recovery-retry", "recovery-start-over"],
  },
  {
    name: "migration-failed",
    screen: "screen-recovery",
    prefix: "recovery",
    actions: ["recovery-retry", "recovery-start-over"],
  },
  {
    name: "restore-failed",
    screen: "screen-recovery",
    prefix: "recovery",
    actions: ["recovery-retry", "recovery-start-over"],
  },
  {
    name: "state-unrecognized",
    screen: "screen-recovery",
    prefix: "recovery",
    actions: ["recovery-retry", "recovery-start-over"],
  },
  {
    name: "encryption-unavailable",
    screen: "screen-encryption-unavailable",
    prefix: "encryption-unavailable",
    actions: [],
  },
  {
    name: "storage-unreachable",
    screen: "screen-storage-unreachable",
    prefix: "storage-unreachable",
    actions: ["storage-unreachable-retry", "storage-unreachable-start-over"],
  },
];

/** The states of #217 R4, which a real attempt shows for a moment and `/dev/boot-screen` holds open. */
const bootStatuses = [
  { name: "retrying", root: "screen-recovery", status: "recovery-status", text: /Trying again/ },
  {
    name: "starting-over",
    root: "screen-storage-unreachable",
    status: "storage-unreachable-status",
    text: /Setting up a new budget/,
  },
  { name: "status-failed", root: "screen-recovery", status: "recovery-status", text: /That didn/ },
  {
    name: "start-over-blocked",
    root: "screen-storage-unreachable",
    status: "storage-unreachable-status",
    text: /Starting over isn/,
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
    // Every screen explains itself in steps, and none of them is a dead end (#60).
    await expect(screen.getByTestId(`${boot.prefix}-steps`)).toBeVisible();
    for (const action of boot.actions) {
      await expect(screen.getByTestId(action)).toBeVisible();
    }
    await app.screenshot(`boot-screen-${boot.name}`);
  });
}

for (const status of bootStatuses) {
  test(`keeps the screen and says "${status.name}" while and after an attempt`, async (fixtures) => {
    // Arrange
    const { app, screen } = fixtures;

    // Act
    await openDevScreen(fixtures, `boot-screen?screen=${status.name}`, status.root);

    // Assert: the screen stays where it was, with its status line (#217 R4) and a spinner once it takes a moment
    const line = screen.getByTestId(status.status);
    await settle();
    await expect(line).toHaveText(status.text);
    await app.screenshot(`boot-status-${status.name}`);
  });
}

/**
 * "Start over" never runs directly (#60): on the secure-storage screen it first asks, in the native confirmation
 * (#217 R2, screens 07 and 12).
 */
test("asks before starting over from the secure storage screen", async (fixtures) => {
  // Arrange
  const { app } = fixtures;
  await openDevScreen(
    fixtures,
    "boot-screen?screen=storage-unreachable",
    "screen-storage-unreachable",
  );

  // Act
  const { confirm } = appAlert(
    fixtures,
    "storage-unreachable-start-over-alert",
    "Start over with an empty budget?",
    "Start over",
  );
  await tapUntilVisible(nativeButton(fixtures, "storage-unreachable-start-over"), confirm);

  // Assert
  await expect(confirm).toBeVisible();
  await app.screenshot("storage-unreachable-start-over-alert");
});

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
  const { confirm } = appAlert(
    fixtures,
    "recovery-start-over-alert",
    "Start over with an empty budget?",
    "Start over",
  );
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

/**
 * The visible retry of #217 R4 on a real failure: asking again over a database this device cannot open keeps the
 * recovery screen on screen the whole time and ends by saying it did not work. A blank screen would be the bug.
 */
test("keeps the recovery screen visible while retrying a real failure", async (fixtures) => {
  // Arrange
  const { app, device, screen } = fixtures;
  await openDevScreen(fixtures, "forget-key", "screen-forget-key");
  await expect(screen.getByTestId("forget-key-result")).toHaveText(/key is gone/);
  await device.closeApp();
  await app.open();
  await expect(screen.getByTestId("screen-recovery")).toBeVisible();

  // Act
  const status = screen.getByTestId("recovery-status");
  await tapUntilVisible(nativeButton(fixtures, "recovery-retry"), status);

  // Assert: the screen is still there with what the app is doing…
  await expect(screen.getByTestId("screen-recovery")).toBeVisible();
  await expect(status).toHaveText(/Trying again/);
  await app.screenshot("recovery-retrying");

  // …and then what the attempt ended with, still on the same screen
  await expect(status).toHaveText(/Nothing has been changed/);
  await expect(screen.getByTestId("screen-recovery")).toBeVisible();
  await app.screenshot("recovery-retry-failed");

  // Clean up: start over for real, so the next test finds a device with a readable budget again
  const { confirm } = appAlert(
    fixtures,
    "recovery-start-over-alert",
    "Start over with an empty budget?",
    "Start over",
  );
  await tapUntilVisible(nativeButton(fixtures, "recovery-start-over"), confirm);
  await confirm.tap();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
});
