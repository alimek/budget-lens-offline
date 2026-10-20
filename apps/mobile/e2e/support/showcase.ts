import type { Device } from "@e2e-dev/mobile";
import { expect, type TestFixtures } from "e2e";

export type Fixtures = TestFixtures & { device: Device };

/** Opens the dev-only showcase from Settings; Expo UI on Android puts the test ID on a wrapper. */
export async function openShowcase({ app, screen, platform }: Fixtures) {
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await screen.getByTestId("tab-settings").tap();
  const open = screen.getByTestId("settings-open-design-system");
  // Below the fold at large text sizes.
  await screen.scrollUntilVisible(open);
  await (platform === "android" ? open.getByRole("button") : open).tap();
  await expect(screen.getByTestId("screen-design-system")).toBeVisible();
}

/**
 * Opens the dev-only list example by deep link, so the showcase (with its secure field, which screenshots mask)
 * is not underneath it. iOS may ask before opening the app's own link; the confirm button is the alert's last one.
 */
export async function openListExample({ app, screen, device, platform }: Fixtures) {
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await device.openLink("budget-lens:///dev/design-system-list");
  const list = screen.getByTestId("screen-design-system-list");
  if (platform === "ios") {
    // The confirmation shows the first time a simulator opens the link; later opens go straight to the app.
    const alert = screen.getByRole("alert");
    for (let attempt = 0; attempt < 20 && !(await list.isVisible()); attempt += 1) {
      if (await alert.isVisible()) {
        await alert.getByRole("button").last().tap();
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  await expect(list).toBeVisible();
}
