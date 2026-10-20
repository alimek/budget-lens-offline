import type { Device } from "@e2e-dev/mobile";
import { expect, type TestFixtures } from "e2e";

export type Fixtures = TestFixtures & { device: Device };

/** Opens the dev-only showcase from Settings; Expo UI on Android puts the test ID on a wrapper. */
export async function openShowcase({ app, screen, platform }: Fixtures) {
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await screen.getByTestId("tab-settings").tap();
  const open = screen.getByTestId("settings-open-design-system");
  // Below the fold only at large text sizes; a tap during scroll momentum would just stop the scroll.
  if (!(await open.isVisible())) {
    await screen.scrollUntilVisible(open);
    await settle();
  }
  await (platform === "android" ? open.getByRole("button") : open).tap();
  await expect(screen.getByTestId("screen-design-system")).toBeVisible();
  // Let the push transition finish: iOS ignores a scroll that starts while the screen is still sliding in.
  await settle();
}

/** Waits for animations (scroll momentum, navigation transitions) that the engine does not wait for. */
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 600));
}

/**
 * Opens the dev-only list example by deep link, so the showcase (with its secure field, which screenshots mask)
 * is not underneath it.
 */
export async function openListExample({ app, screen, device, platform }: Fixtures) {
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await device.openLink("budget-lens:///dev/design-system-list");
  const list = screen.getByTestId("screen-design-system-list");
  if (platform === "ios") await confirmOpenInApp(screen, list);
  await expect(list).toBeVisible();
}

/**
 * iOS asks "Open in <app>?" the first time a simulator opens the app's own link; later opens go straight to the
 * app. Confirms (the alert's last button) if the alert shows before the target screen does.
 */
async function confirmOpenInApp(
  screen: Fixtures["screen"],
  target: ReturnType<Fixtures["screen"]["getByTestId"]>,
) {
  const alert = screen.getByRole("alert");
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await target.isVisible()) return;
    if (await alert.isVisible()) return alert.getByRole("button").last().tap();
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
