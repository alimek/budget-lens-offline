import type { Device } from "@e2e-dev/mobile";
import { expect, type TestFixtures } from "e2e";

export type Fixtures = TestFixtures & { device: Device };
type Locator = ReturnType<Fixtures["screen"]["getByTestId"]>;

/** Opens the dev-only showcase from Settings; Expo UI on Android puts the test ID on a wrapper. */
export async function openShowcase({ app, screen, platform }: Fixtures) {
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await tapUntilVisible(screen.getByTestId("tab-settings"), screen.getByTestId("screen-settings"));
  const open = screen.getByTestId("settings-open-design-system");
  // Target Settings itself: the viewport scroll can stall inside the long privacy text at large sizes.
  // A tap during scroll momentum would just stop the scroll.
  if (!(await open.isVisible())) {
    const settings = screen.getByTestId("screen-settings");
    await settings.scrollUntilVisible(open);
    // Visibility can begin underneath the floating tab bar. The button is the last Settings control;
    // one more bounded scroll brings it clear of the bar before tapping.
    await settings.swipe({ direction: "down", momentum: "slow" });
    await settle();
  }
  await tapUntilVisible(
    platform === "android" ? open.getByRole("button") : open,
    screen.getByTestId("screen-design-system"),
  );
  // Let the push transition finish: iOS ignores a scroll that starts while the screen is still sliding in.
  await settle();
}

/** Waits for animations (scroll momentum, navigation transitions) that the engine does not wait for. */
export function settle(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Taps `control` and waits for `result`. A loaded iOS simulator sometimes drops a tap that lands while the app is
 * still settling (launch, deep link, transition); the tap is repeated once more in that case, never more, so a
 * control that really does nothing still fails the test.
 */
export async function tapUntilVisible(control: Locator, result: Locator) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await control.tap();
    for (let poll = 0; poll < 12; poll += 1) {
      if (await result.isVisible()) return;
      await settle(250);
    }
  }
  await expect(result).toBeVisible();
}

/**
 * Opens a development-only route by deep link and waits for its screen. The boot screens show only while the
 * database stays closed, so every route is opened over the running app.
 */
export async function openDevScreen(fixtures: Fixtures, route: string, testID: string) {
  const { app, screen, device, platform } = fixtures;
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await device.openLink(`budget-lens:///dev/${route}`);
  const target = screen.getByTestId(testID);
  if (platform === "ios") await confirmOpenInApp(screen, target);
  await expect(target).toBeVisible();
}

/** Opens the dev-only list example, so the showcase (with its secure field, which screenshots mask) is not under it. */
export function openListExample(fixtures: Fixtures) {
  return openDevScreen(fixtures, "design-system-list", "screen-design-system-list");
}

/**
 * iOS asks "Open in <app>?" the first time a simulator opens the app's own link; later opens go straight to the
 * app. Confirms (the alert's last button) if the alert shows before the target screen does.
 */
async function confirmOpenInApp(screen: Fixtures["screen"], target: Locator) {
  const alert = screen.getByRole("alert");
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await target.isVisible()) return;
    if (await alert.isVisible()) return alert.getByRole("button").last().tap();
    await settle(250);
  }
}

/**
 * Swipes a list row to the left to reveal its actions. The row's test ID can sit on a small control inside the row
 * (on iOS the paid button), where a swipe would be a tap, so the swipe runs across the list at the row's height.
 */
export async function swipeRowLeft(
  screen: Fixtures["screen"],
  row: Locator,
  listTestID = "ds-list",
) {
  await expect(row).toBeVisible();
  const list = await screen.getByTestId(listTestID).boundingBox();
  const box = await row.boundingBox();
  if (!list || !box) throw new Error("the list or the row has no bounds");
  const y = box.y + box.height / 2;
  await screen.swipe({
    from: { x: list.x + list.width * 0.85, y },
    to: { x: list.x + list.width * 0.25, y },
    duration: 400,
  });
  await settle();
}

/**
 * The tappable node of an Expo UI button: on Android the test ID sits on a wrapper around the Compose button (see
 * docs/testing.md), on iOS on the button itself.
 */
export function nativeButton(
  { screen, platform }: Pick<Fixtures, "screen" | "platform">,
  testID: string,
) {
  const node = screen.getByTestId(testID);
  return platform === "android" ? node.getByRole("button") : node;
}

/**
 * The node that carries a Compose `semantics` content description: Compose exposes it on a child of the test ID
 * node when the control also has text (as with the paid checkbox, #182).
 */
export function describedNode(
  { screen, platform }: Pick<Fixtures, "screen" | "platform">,
  testID: string,
) {
  const node = screen.getByTestId(testID);
  return platform === "android" ? node.getByRole("group").first() : node;
}

/**
 * An `AppAlert` and its confirm button. On iOS it is the system alert (React Native `Alert`), which has no
 * identifiers and its container kind varies between native snapshots. Find the innermost container labelled by
 * the title that contains the named confirm button, excluding matching triggers behind the modal. On Android the
 * Compose dialog's confirm button carries `<testID>-confirm`.
 */
export function appAlert(
  fixtures: Pick<Fixtures, "screen" | "platform" | "device">,
  testID: string,
  title: string,
  confirmLabel: string,
) {
  if (fixtures.platform === "android") {
    const confirm = nativeButton(fixtures, `${testID}-confirm`);
    return { alert: confirm, confirm };
  }
  const alert = fixtures.screen.getByText(title);
  const container = fixtures.device
    .locator(`label=${JSON.stringify(title)}`)
    .filter({ has: fixtures.screen.getByRole("button", confirmLabel) })
    .last();
  return { alert, confirm: container.getByRole("button", confirmLabel) };
}

/** Showcase nodes from top to bottom, close enough that scrolling to each in turn leaves no part of the page out. */
const showcaseAnchors = [
  "ds-toggle",
  "ds-progress-over",
  "ds-section-inputs",
  "ds-amount-field",
  "ds-picker",
  "ds-date-picker",
  "ds-section-overlays",
  "ds-overlay-result",
  "ds-section-lists",
  "ds-section-amounts",
  "ds-amount-zero",
  "ds-section-typography",
  "ds-type-title-1",
  "ds-type-title-3",
  "ds-type-body",
  "ds-type-subheadline",
  "ds-type-caption",
  "ds-section-colors",
  "ds-swatches-light",
  "ds-swatches-dark",
];

/**
 * Scrolls the showcase until `target` is visible. At large text sizes the engine's scroll on iOS can start on an
 * embedded SwiftUI control, which swallows it ("scroll down moved nothing"); slow drags along the page's left margin,
 * where there is only the scroll view, are the fallback.
 */
export async function scrollShowcaseTo(screen: Fixtures["screen"], target: Locator) {
  try {
    await screen.scrollUntilVisible(target);
  } catch (error) {
    if (!(await dragAlongMargin(screen, target))) throw error;
  }
}

/** Drags the showcase up along its left margin until `target` is visible; false if it never shows. */
async function dragAlongMargin(screen: Fixtures["screen"], target: Locator) {
  const page = await screen.getByTestId("screen-design-system").boundingBox();
  if (!page) return false;
  const x = page.x + 6;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (await target.isVisible()) return true;
    await screen.swipe({
      from: { x, y: page.y + page.height * 0.75 },
      to: { x, y: page.y + page.height * 0.35 },
      duration: 1200,
    });
    await settle();
  }
  return target.isVisible();
}

/**
 * Captures the whole showcase page by page (`<name>-1`, `<name>-2`, …) for the review evidence: it scrolls to each
 * anchor in turn and captures each new position. The engine's scroll is used because plain swipes on iOS were
 * sometimes dropped right after an appearance switch.
 */
export async function captureShowcase(
  { app, screen }: Pick<Fixtures, "app" | "screen">,
  name: string,
) {
  let index = 1;
  await app.screenshot(`${name}-${index}`);
  for (const id of showcaseAnchors) {
    const anchor = screen.getByTestId(id);
    if (await anchor.isVisible()) continue;
    await scrollShowcaseTo(screen, anchor);
    await settle();
    index += 1;
    await app.screenshot(`${name}-${index}`);
  }
}
