// The item sheet (#82) on a development build: adding the first item from an empty list, the validation the form
// reports before it lets anything be saved, editing a recurring item from a later month through the "Applies
// from" picker of #64, the scheduled change that is kept or replaced, and an amount in a currency that has no
// minor digits. Every write goes through the real repositories, so the list that shows it is read exactly as a
// user's would be. The seeded rows come from the development seeder; each run archives what it creates, so the
// next one still starts from an empty list. The devices run in English (docs/testing.md).
import { test } from "@e2e-dev/mobile";
import type { Locator } from "e2e";
import { expect } from "e2e";
import {
  appAlert,
  type Fixtures,
  nativeButton,
  openDevScreen,
  settle,
  tapUntilVisible,
} from "./support/showcase";

// The seeder writes `dev-seed-<gen>-<slug>` ids, so every run gets rows of its own. An item created in the form
// carries a generated uuid instead, which is what `created` reads back.
const gen = Date.now();
const rowID = (slug: string) => `items-row-dev-seed-${gen}-${slug}`;
const created = (screen: Fixtures["screen"]) =>
  screen.getByTestId(/^items-row-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

/** Runs one button of the development seeder and returns the month its rows are anchored to. */
async function seed(fixtures: Fixtures, button: string, result: RegExp): Promise<string> {
  const { screen } = fixtures;
  await openDevScreen(fixtures, `items-seed?gen=${gen}`, "screen-dev-items-seed");
  await nativeButton(fixtures, button).tap();
  await expect(screen.getByTestId("dev-items-seed-result")).toHaveText(result);
  // The month the app may plan against, read back rather than guessed from a clock a stored month can disagree
  // with (#82's planning rule).
  const month = (await screen.getByTestId("dev-items-seed-month").textContent())?.trim() ?? "";
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error(`the seeder reports no month: "${month}"`);
  return month;
}

/** The Items tab, over a cold start, so no earlier test's navigation is relied on. */
async function openItemsTab({ app, device, screen }: Fixtures) {
  forgetGeometry();
  await device.closeApp();
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await tapUntilVisible(screen.getByTestId("tab-items"), screen.getByTestId("screen-items"));
  await measureTabBar(screen);
}

/**
 * Reads the one line the rest of the run is measured against. A hosted sheet keeps the tab bar out of its own
 * tree, so it is read here, over the list, where it is on screen, and kept: the bar keeps its line for the run.
 */
async function measureTabBar(screen: Fixtures["screen"]) {
  if (tabTop !== null) return;
  const tabs = await boxOf(screen.getByTestId("tab-items"));
  if (tabs !== null) tabTop = tabs.y - TAP_MARGIN;
}

/** `after` months behind `month`, as the month pickers' test IDs spell it. */
function monthAfter(month: string, after: number): string {
  const parts = month.split("-");
  const index = Number(parts[0]) * 12 + Number(parts[1]) - 1 + after;
  return `${String(Math.floor(index / 12))}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** A rectangle as the engine reports it, or none while the node is not in the tree. */
type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

/** The sheet itself, and nothing of the controls inside it that share its prefix. */
const SHEET = "item-sheet";
/** The list the sheet is opened over. */
const LIST = "items-list";
/** Keeps a tap off the very last line of the reachable band. */
const TAP_MARGIN = 8;
/** Scrolls this many times, dragging between the attempts. */
const SCROLL_TRIES = 3;
/** One engine scroll is bounded: a control nothing scrolls to is a failure, not a stall of the suite. */
const SCROLL_WAIT = 4_000;
/**
 * A drag this far up the container, and this far across it. The middle of the column is the one place a vertical
 * drag is never taken for a system edge gesture, whatever the container's width turns out to be.
 */
const DRAG_INSET = 0.5;
const DRAG_FROM = 0.7;
const DRAG_TO = 0.35;
const DRAG_DURATION = 900;
/** A press gets these attempts, each given this much time to show the effect it is meant to have. */
const PRESS_TRIES = 3;
const PRESS_WAIT = 6_000;
/** An entry gets these attempts before the field is failed on what it holds. */
const TYPE_TRIES = 3;
/** The long flows of this sheet get more than the default deadline of one test. */
const FORM = { timeout: 300_000 };

/**
 * Where the floating tab bar begins. Reading the tree is the expensive part of this suite, and the bar keeps its
 * line for the whole run, so it is read once and remembered: a sheet is hosted behind it, so the line measured
 * over the list is what a sheet's own column is measured against too. The containers a form and a list scroll are
 * remembered the same way, and `forgetGeometry` drops them when the keyboard takes some of a sheet away (#61
 * commits an amount with the Done of its own bar, which is also what puts the keyboard back).
 */
let tabTop: number | null = null;
const containers = new Map<string, Box>();

function forgetGeometry() {
  containers.clear();
}

/** Reads a node's rectangle once, saying nothing about whether it is where a tap would land. */
async function boxOf(node: Locator): Promise<Box | null> {
  return await node.boundingBox().catch(() => null);
}

/** The rectangle of a scrolling container, read once per screen of it. */
async function containerBox(screen: Fixtures["screen"], container: string): Promise<Box | null> {
  const remembered = containers.get(container);
  if (remembered !== undefined) return remembered;
  const box = await boxOf(screen.getByTestId(container));
  if (box !== null) containers.set(container, box);
  return box;
}

/**
 * The lowest line a tap may aim at: what the container has room for, less the strip the floating tab bar covers.
 * `null` while the container itself has not been measured.
 */
async function reachLine(screen: Fixtures["screen"], container: string): Promise<number | null> {
  const box = await containerBox(screen, container);
  if (box === null) return null;
  return tabTop === null ? box.y + box.height : Math.min(box.y + box.height, tabTop);
}

/** Whether a node lies inside the band a tap can reach. */
async function isReachable(
  screen: Fixtures["screen"],
  node: Locator,
  container: string,
): Promise<boolean> {
  const box = await boxOf(node);
  if (box === null) return false;
  const line = await reachLine(screen, container);
  return line === null ? false : box.y + box.height <= line;
}

/**
 * One drag up the container's own scroll view, a hand's width in from its edge: at the very edge the system takes
 * the gesture for itself, and nothing moves.
 */
async function dragUp(screen: Fixtures["screen"], container: string) {
  const box = await containerBox(screen, container);
  if (box === null) return;
  const x = box.x + box.width * DRAG_INSET;
  await screen.swipe({
    from: { x, y: box.y + box.height * DRAG_FROM },
    to: { x, y: box.y + box.height * DRAG_TO },
    duration: DRAG_DURATION,
  });
  await settle();
}

/**
 * Brings a control into the band where a tap reaches it; false while it is not on the screen at all. A sheet and a
 * list both hand accessibility the children they have scrolled out of view as well, with frames lying under the
 * fold, so a node down there is in the tree, reads as visible, and is drawn somewhere else entirely: its rectangle
 * is measured rather than trusted (#63's one scrolling column). The engine's own scroll comes first, since it also
 * reaches a control a hosted sheet has not handed accessibility yet.
 */
async function scrollIntoReach(
  screen: Fixtures["screen"],
  node: Locator,
  container: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < SCROLL_TRIES; attempt += 1) {
    if (await isReachable(screen, node, container)) return true;
    await screen.scrollUntilVisible(node, { timeout: SCROLL_WAIT }).catch(() => {});
    if (await isReachable(screen, node, container)) return true;
    await dragUp(screen, container);
  }
  return await node.isVisible().catch(() => false);
}

/** What a press is meant to cause: a node that has to show, or one that has to go away. */
interface Effect {
  readonly node: Locator;
  readonly state: "visible" | "detached";
}

/** The effects of a press, read as the two states the engine waits for. */
const shown = (node: Locator): Effect => ({ node, state: "visible" });
const gone = (node: Locator): Effect => ({ node, state: "detached" });

/** Whether an effect has happened, each attempt given its own deadline. */
async function happened(effect: Effect): Promise<boolean> {
  return await effect.node
    .waitFor({ state: effect.state, timeout: PRESS_WAIT })
    .then(() => true)
    .catch(() => false);
}

/** Reports an effect that never came, with the assertion the run shows; nothing when nothing was asked for. */
async function requireEffect(effect: Effect | undefined): Promise<void> {
  if (effect === undefined) return;
  if (effect.state === "visible") await expect(effect.node).toBeVisible();
  else await expect(effect.node).toHaveCount(0);
}

/** Whether the press is done: the effect it was asked for has happened, or none was asked for. */
async function satisfied(effect: Effect | undefined): Promise<boolean> {
  return effect === undefined || (await happened(effect));
}

/** Brings one control into reach and presses it once; false while it is not on the screen to press. */
async function pressOnce(
  fixtures: Fixtures,
  control: Control,
  container: string,
): Promise<boolean> {
  const node = await control();
  if ((await scrollIntoReach(fixtures.screen, node, container)) === false) return false;
  await node.tap().catch(() => {});
  return true;
}

/**
 * Presses a control and waits for what it is meant to cause. A press is aimed at a measured rectangle, and a
 * hosted sheet keeps handing out the frames of what it has scrolled away, so a press can land on the wrong pixels
 * and change nothing: the effect says so, and the press is made again from a fresh read. A control that really
 * does nothing still fails the test, on the effect it was asked for.
 */
async function press(
  fixtures: Fixtures,
  control: Control,
  container: string,
  effect?: Effect,
): Promise<void> {
  for (let attempt = 0; attempt < PRESS_TRIES; attempt += 1) {
    if ((await pressOnce(fixtures, control, container)) && (await satisfied(effect))) return;
    await settle(500);
  }
  await requireEffect(effect);
}

/** How long the look for a button inside a control is given before the control is pressed as it stands. */
const TARGET_PROBE = 1_500;
/** How long a control of a sheet that is still opening is given to arrive at all. */
const ARRIVAL_WAIT = 10_000;

/**
 * What a press is aimed at, read again for every attempt: a control of a sheet that is still opening is not in
 * the tree at the first look, and a frame measured once would be aimed at nothing.
 */
type Control = () => Promise<Locator>;

/**
 * What a press of a named control is aimed at. Most controls of the sheet are a node with a button inside it,
 * which is what `nativeButton` finds; a Compose field that is a control of its own, like an exposed dropdown or
 * the floating "Add item", carries its test ID on the button and has no button inside it (#82).
 */
async function pressTarget(fixtures: Fixtures, testID: string): Promise<Locator> {
  const node = fixtures.screen.getByTestId(testID);
  if (fixtures.platform !== "android") return node;
  // A sheet hands its controls to accessibility as it lays them out, so the control is waited for first: looking
  // for the button of a node that is not there yet says nothing about whether it has one.
  await node.waitFor({ state: "attached", timeout: ARRIVAL_WAIT }).catch(() => {});
  const inner = node.getByRole("button");
  const found = await inner
    .waitFor({ state: "attached", timeout: TARGET_PROBE })
    .then(() => true)
    .catch(() => false);
  return found ? inner : node;
}

/** Presses a control of the item sheet, whose actions sit at the foot of one scrolling column. */
async function pressSheet(fixtures: Fixtures, testID: string, effect?: Effect): Promise<void> {
  await press(fixtures, () => pressTarget(fixtures, testID), SHEET, effect);
}

/** Opens a row of the list, which the tab bar can cover the same way a sheet covers its own actions. */
async function openRow(fixtures: Fixtures, row: Locator): Promise<void> {
  await press(fixtures, async () => row, LIST, shown(fixtures.screen.getByTestId(SHEET)));
}

/** Brings a row of the list into the band a tap reaches, which reading its name needs just as much as tapping it. */
async function revealRow(fixtures: Fixtures, row: Locator): Promise<void> {
  await scrollIntoReach(fixtures.screen, row, LIST);
}

/** Brings a control of the item sheet into the band a tap reaches, for a look rather than for a press. */
async function revealSheet(fixtures: Fixtures, testID: string): Promise<void> {
  await scrollIntoReach(fixtures.screen, fixtures.screen.getByTestId(testID), SHEET);
}

/**
 * Chooses a currency in the menu inside the amount field and waits for the pick to land. While the menu's popover
 * is up it owns the screen and swallows the next touch, so the entry of a field filled straight after a pick would
 * land nowhere; the field the menu sits in names the currency it holds, which is what says the pick is through.
 */
async function chooseCurrency(fixtures: Fixtures, code: string): Promise<void> {
  const { screen } = fixtures;
  const menu = screen.getByTestId("item-amount-currency");
  const opener = await pressTarget(fixtures, "item-amount-currency");
  const option = screen.getByTestId(`item-amount-currency-${code}`);
  const picked = shown(menu.filter({ hasText: code }));
  for (let attempt = 0; attempt < PRESS_TRIES; attempt += 1) {
    await opener.tap().catch(() => {});
    if (await happened(shown(option))) {
      await option.tap().catch(() => {});
      await option.waitFor({ state: "detached", timeout: PRESS_WAIT }).catch(() => {});
      if (await happened(picked)) return;
    }
    await settle(500);
  }
  await requireEffect(picked);
}

/**
 * Types into a field of the sheet and ends the entry the way the app does. A field of a sheet that has just closed
 * a menu is sometimes still settling and the entry then lands nowhere, so the entry is repeated until the field
 * reads back what was typed. An amount commits with the Done of its own keyboard bar (#61), which is also what puts
 * the keyboard away: dragging the keyboard away instead would drag the hosted sheet with it.
 */
async function typeInto(fixtures: Fixtures, testID: string, text: string): Promise<void> {
  const { screen } = fixtures;
  const field = screen.getByTestId(testID);
  forgetGeometry();
  for (let attempt = 0; attempt < TYPE_TRIES; attempt += 1) {
    await field.tap().catch(() => {});
    await settle(400);
    await field.fill(text).catch(() => {});
    if ((await field.inputValue().catch(() => null)) === text) break;
    await settle(700);
  }
  await expect(field).toHaveValue(text);
  await endEntry(fixtures, testID);
  forgetGeometry();
}

/**
 * Puts the keyboard away with the Done of its own bar (#61). That bar belongs to the keyboard, and the engine reads
 * the whole keyboard as covering it, so the press is aimed at a point of its box rather than through its usual
 * actionability checks; the bar is only in the tree while a field is being edited, so its absence is the keyboard
 * already being gone.
 */
async function endEntry(fixtures: Fixtures, testID: string): Promise<void> {
  const done = fixtures.screen.getByTestId(`${testID}-done`);
  for (let attempt = 0; attempt < PRESS_TRIES; attempt += 1) {
    const box = await done.boundingBox().catch(() => null);
    if (box === null) return;
    await done.tap({ position: { x: box.width / 2, y: box.height / 2 } }).catch(() => undefined);
    await settle(500);
  }
  await expect(done).toHaveCount(0);
}

/** Archives an item from inside its own sheet (#63, decision 1: archive, never delete). */
async function archiveFromSheet(fixtures: Fixtures, name: string, row: Locator): Promise<void> {
  const { screen } = fixtures;
  await openRow(fixtures, row);
  const { alert, confirm } = appAlert(
    fixtures,
    "item-archive-dialog",
    `Archive “${name}”?`,
    "Archive",
  );
  await pressSheet(fixtures, "item-archive", shown(alert));
  await confirm.tap();
  await expect(screen.getByTestId(SHEET)).toHaveCount(0);
  await expect(row).toHaveCount(0);
}

test(
  "adds the first item from the empty list and lists it with its summary",
  FORM,
  async (fixtures) => {
    // Arrange
    const { app, screen } = fixtures;
    await seed(fixtures, "dev-items-seed-clear", /archived/i);
    await openItemsTab(fixtures);
    await expect(screen.getByTestId("items-empty")).toBeVisible();

    // Act: the empty state's call to action opens the sheet in create mode (#63).
    await tapUntilVisible(
      await pressTarget(fixtures, "items-empty-add"),
      screen.getByTestId("item-sheet"),
    );

    // Assert: a new item is created from scratch: the type is chosen, the currency is editable, and there is no
    // "Applies from", because there is nothing to change from yet (#64).
    for (const id of [
      "item-type",
      "item-name",
      "item-amount",
      "item-repeats",
      "item-first-month",
    ]) {
      await expect(screen.getByTestId(id)).toBeVisible();
    }
    await expect(screen.getByTestId("item-applies-from")).toHaveCount(0);

    // Act: the fields first, then the currency the amount is counted in. Compose hands the accessory at the end
    // of a text field to accessibility only once the field has been through a change, so a field that has never
    // been typed into reports no currency control to a screen reader either (#61, variant A).
    await typeInto(fixtures, "item-name", "E2E water");
    await typeInto(fixtures, "item-amount", "1234.56");
    await chooseCurrency(fixtures, "PLN");
    await app.screenshot("item-form-add");

    // Assert: the plain-language preview of #63, resolved by the engine the forecast uses.
    await expect(screen.getByTestId("item-preview-summary")).toHaveText(/Monthly/);
    await expect(screen.getByTestId("item-preview-next")).toContainText(/Next: /);

    // Act
    await pressSheet(fixtures, "item-add", gone(screen.getByTestId(SHEET)));

    // Assert: the row is listed, named as one sentence with its amount and its summary (#63 accessibility).
    const row = created(screen);
    await revealRow(fixtures, row);
    await expect(row).toHaveAccessibleName(/E2E water, expense, .*1,234\.56.*Monthly/);
    await app.screenshot("items-after-add");

    // Act / Assert: archived again from its own sheet, which leaves the list empty for the next run.
    await archiveFromSheet(fixtures, "E2E water", row);
    await expect(screen.getByTestId("items-empty")).toBeVisible();
  },
);

test("reports the fields the form is missing before it saves", FORM, async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await seed(fixtures, "dev-items-seed-seed", /written/i);
  await openItemsTab(fixtures);
  // The way in when there is already something to list: the header's "+" on iOS, the floating one on Android.
  await tapUntilVisible(await pressTarget(fixtures, "items-add"), screen.getByTestId("item-sheet"));

  // Act: nothing filled in.
  await pressSheet(fixtures, "item-add", shown(screen.getByTestId("item-errors-summary")));

  // Assert: how many fields need attention, and which they are (#63).
  await expect(screen.getByTestId("item-errors-summary")).toHaveText(/2 fields need attention/);
  await expect(screen.getByTestId("item-name-error")).toHaveText(/Enter a name/);
  await expect(screen.getByTestId("item-amount-error")).toHaveText(/Enter an amount/);
  // The sheet stays open: nothing was written.
  await expect(screen.getByTestId("item-sheet")).toBeVisible();

  // Act
  await typeInto(fixtures, "item-amount", "0");

  // Assert: an amount of 0 is refused with its own message (#63, decision 3), and the sheet still holds it.
  await expect(screen.getByTestId("item-amount-error")).toHaveText(
    /Enter an amount greater than 0/,
  );
  await app.screenshot("item-form-validation");

  // Act: leaving a form that holds something is confirmed first (#63).
  const { alert, confirm } = appAlert(
    fixtures,
    "item-discard-dialog",
    "Discard changes?",
    "Discard",
  );
  await pressSheet(fixtures, "item-cancel", shown(alert));
  await app.screenshot("item-form-discard");

  // Assert: the form is gone and the list is what it was.
  await confirm.tap();
  await expect(screen.getByTestId("item-sheet")).toHaveCount(0);
  await expect(screen.getByTestId(rowID("rent"))).toBeVisible();
});

test(
  "edits a recurring item from a later month, leaving earlier months alone",
  FORM,
  async (fixtures) => {
    // Arrange
    const { app, screen } = fixtures;
    const month = await seed(fixtures, "dev-items-seed-seed", /written/i);
    await openItemsTab(fixtures);
    const rent = screen.getByTestId(rowID("rent"));
    await expect(rent).toHaveAccessibleName(/Rent, expense, .*3,200\.00.*Monthly/);

    // Act: the row itself opens the sheet in edit mode (#82).
    await openRow(fixtures, rent);
    await expect(screen.getByTestId("item-sheet")).toBeVisible();

    // Assert: the type is fixed after creation and the currency is locked, with the reason said (#63, #82).
    await expect(screen.getByTestId("item-type")).toBeVisible();
    await expect(screen.getByTestId("item-amount-currency")).toHaveText(/PLN/);
    await expect(screen.getByTestId("item-amount-currency-EUR")).toHaveCount(0);
    await expect(screen.getByTestId("item-amount-helper")).toHaveText(
      /The currency can't be changed after the item is created\./,
    );
    // A recurring item is edited from a month the user picks, and the hint says what the earlier ones keep (#64).
    await expect(screen.getByTestId("item-applies-from")).toBeVisible();
    await expect(screen.getByTestId("item-applies-from-hint")).toContainText(
      /keep their current amount and schedule/,
    );

    // Act: a new amount, starting two months from the active one.
    await typeInto(fixtures, "item-amount", "3500.00");
    const later = monthAfter(month, 2);
    await pressSheet(
      fixtures,
      "item-applies-from",
      shown(screen.getByTestId(`item-applies-from-${month}`)),
    );
    await screen.getByTestId(`item-applies-from-${later}`).tap();
    await expect(screen.getByTestId(`item-applies-from-${month}`)).toHaveCount(0);
    await settle();
    await app.screenshot("item-form-applies-from");

    // Act
    await pressSheet(fixtures, "item-save", gone(screen.getByTestId(SHEET)));

    // Assert: this month still shows the amount it had, and the row carries the change that is still to come (#40).
    await expect(rent).toHaveAccessibleName(/Rent, expense, .*3,200\.00.*Change from/);
    await app.screenshot("items-after-scheduled-edit");
  },
);

test("keeps a scheduled change and undoes the choice to replace it", FORM, async (fixtures) => {
  // Arrange: the seeded internet has a change already scheduled two months ahead.
  const { app, screen } = fixtures;
  await seed(fixtures, "dev-items-seed-seed", /written/i);
  await openItemsTab(fixtures);
  await openRow(fixtures, screen.getByTestId(rowID("internet")));
  await expect(screen.getByTestId("item-sheet")).toBeVisible();

  // Assert: the live dry run of #64 says a change is scheduled, and offers to replace it.
  const replace = screen.getByTestId("item-notice-scheduled-replace");
  const keep = screen.getByTestId("item-notice-scheduled-keep");
  await expect(screen.getByTestId("item-notice-scheduled")).toBeVisible();
  await revealSheet(fixtures, "item-notice-scheduled-replace");
  await expect(replace).toBeVisible();
  await app.screenshot("item-form-scheduled-notice");

  // Act
  await pressSheet(fixtures, "item-notice-scheduled-replace", shown(keep));

  // Assert: replacing is undone by "Keep the scheduled change" (#64, decision 3).
  await app.screenshot("item-form-scheduled-replaced");
  await pressSheet(fixtures, "item-notice-scheduled-keep", shown(replace));

  // Assert: back to the choice. Nothing in the form was changed, so the sheet closes at once (#63) and the
  // scheduled change the row shows is the one that was seeded.
  await pressSheet(fixtures, "item-cancel", gone(screen.getByTestId(SHEET)));
  const internet = screen.getByTestId(rowID("internet"));
  await revealRow(fixtures, internet);
  await expect(internet).toHaveAccessibleName(/Change from/);
});

test("keeps an amount whole in a currency without minor digits", FORM, async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  // Seeded first, so a currency one of the rows already uses is offered right after the base one (#61, decision 4).
  await seed(fixtures, "dev-items-seed-seed", /written/i);
  await openItemsTab(fixtures);
  await tapUntilVisible(await pressTarget(fixtures, "items-add"), screen.getByTestId("item-sheet"));
  await typeInto(fixtures, "item-name", "E2E manga");
  await typeInto(fixtures, "item-amount", "1000");

  // Act: the currency the field is counted in, from inside the field (#61, variant A). Yen has no minor units,
  // so the whole amount the field already holds stays as it is.
  await chooseCurrency(fixtures, "JPY");

  // Assert: with no rate store yet (#92) the field says there is nothing to convert with, and offers no manual
  // rate either, because that screen (#144, #145) does not exist.
  await expect(screen.getByTestId("item-amount-hint")).toHaveText(/No exchange rate yet/);
  await expect(screen.getByText(/Enter rate manually/)).toHaveCount(0);

  // Assert: yen has no minor units, so the field holds a whole amount with no decimal separator at all (#61).
  await expect(screen.getByTestId("item-amount")).toHaveValue(/^1[ ,\u00a0.]?000$/);
  await settle();
  await app.screenshot("item-form-jpy");

  // Act
  await pressSheet(fixtures, "item-add", gone(screen.getByTestId(SHEET)));

  // Assert: the listed amount is whole too, and the row still says there is no rate for it.
  const row = created(screen);
  await revealRow(fixtures, row);
  await expect(row).toHaveAccessibleName(/E2E manga, expense, [^,]*1,000,.*No rate yet/);
  await app.screenshot("items-after-jpy-add");

  // Act / Assert: archived again, so the device is left as the run found it.
  await archiveFromSheet(fixtures, "E2E manga", row);
});
