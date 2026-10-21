import { type Device, test } from "@e2e-dev/mobile";
import { expect, type TestFixtures } from "e2e";

type Fixtures = TestFixtures & { device: Device };
type Locator = ReturnType<Fixtures["screen"]["getByTestId"]>;

/** iOS asks "Open in <app>?" the first time a simulator opens the app's own link; later ones go straight in. */
async function confirmOpenInApp(screen: Fixtures["screen"], target: Locator) {
  const alert = screen.getByRole("alert");
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await target.isVisible()) return;
    if (await alert.isVisible()) {
      await alert.getByRole("button").last().tap();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

/** Opens a development-only route by deep link: the boot screens show only while the database stays closed. */
async function openDevScreen(fixtures: Fixtures, route: string, testID: string) {
  const { app, screen, device } = fixtures;
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await device.openLink(`budget-lens:///dev/${route}`);
  const target = screen.getByTestId(testID);
  if (fixtures.platform === "ios") await confirmOpenInApp(screen, target);
  await expect(target).toBeVisible();
}

interface BootScreenCase {
  name: string;
  screen: string;
  /** The one control the screen leaves the user, when it leaves one at all. */
  action: string | null;
}

const bootScreens: BootScreenCase[] = [
  { name: "recovery", screen: "screen-recovery", action: "recovery-start-over" },
  { name: "migration-failed", screen: "screen-recovery", action: "recovery-start-over" },
  { name: "encryption-unavailable", screen: "screen-encryption-unavailable", action: null },
  {
    name: "storage-unreachable",
    screen: "screen-storage-unreachable",
    action: "storage-unreachable-retry",
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
    if (boot.action !== null) {
      await expect(screen.getByTestId(boot.action)).toBeVisible();
    }
    await app.screenshot(`boot-screen-${boot.name}`);
  });
}
