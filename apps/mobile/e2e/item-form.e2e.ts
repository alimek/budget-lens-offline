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
  await device.closeApp();
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await tapUntilVisible(screen.getByTestId("tab-items"), screen.getByTestId("screen-items"));
}

/** `after` months behind `month`, as the month pickers' test IDs spell it. */
function monthAfter(month: string, after: number): string {
  const parts = month.split("-");
  const index = Number(parts[0]) * 12 + Number(parts[1]) - 1 + after;
  return `${String(Math.floor(index / 12))}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** The sheet's own rectangle, which the fallback drag is measured against. */
type SheetBox = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

/**
 * Brings a control into the sheet's visible area. The form is one scrolling column (#63), so what sits below
 * the fold – the actions, "Applies from", a notice – has to be scrolled to before it can be read or tapped.
 */
async function reveal({ screen }: Fixtures, testID: string) {
  const control = screen.getByTestId(testID);
  if (await control.isVisible()) return;
  try {
    await screen.scrollUntilVisible(control);
  } catch (error) {
    await dragIntoView(screen, control, error);
  }
}

/**
 * The fallback of a scroll that moved nothing: inside the hosted sheet the engine's scroll can start on a native
 * control, so the sheet is dragged instead, slowly, along its own left edge where only its scroll view is.
 */
async function dragIntoView(screen: Fixtures["screen"], control: Locator, cause: unknown) {
  const sheet = await screen.getByTestId(/^item-sheet/).boundingBox();
  if (sheet === null) throw cause;
  if (await dragSheet(screen, control, sheet)) return;
  throw cause;
}

/** Repeats one drag until the control is on screen, and says whether it ever got there. */
async function dragSheet(screen: Fixtures["screen"], control: Locator, sheet: SheetBox) {
  for (let attempt = 0; attempt < DRAG_ATTEMPTS; attempt += 1) {
    if (await control.isVisible()) return true;
    await screen.swipe({
      from: { x: sheet.x + SHEET_EDGE, y: sheet.y + sheet.height * DRAG_FROM },
      to: { x: sheet.x + SHEET_EDGE, y: sheet.y + sheet.height * DRAG_TO },
      duration: DRAG_DURATION,
    });
    await settle();
  }
  return control.isVisible();
}

/** A drag this far up the sheet, this many times, at the sheet's left edge. */
const DRAG_ATTEMPTS = 8;
const SHEET_EDGE = 8;
const DRAG_FROM = 0.7;
const DRAG_TO = 0.35;
const DRAG_DURATION = 900;

/** Types into a field and lets go of the keyboard, which on both platforms covers what sits below the field. */
async function typeInto(fixtures: Fixtures, testID: string, text: string) {
  const { device, screen } = fixtures;
  await screen.getByTestId(testID).fill(text);
  await device.dismissKeyboard();
}

/** Archives an item from inside its own sheet (#63, decision 1: archive, never delete). */
async function archiveFromSheet(fixtures: Fixtures, name: string, row: ReturnType<typeof created>) {
  const { screen } = fixtures;
  await row.tap();
  await expect(screen.getByTestId("item-sheet")).toBeVisible();
  await reveal(fixtures, "item-archive");
  const { alert, confirm } = appAlert(
    fixtures,
    "item-archive-dialog",
    `Archive “${name}”?`,
    "Archive",
  );
  await tapUntilVisible(nativeButton(fixtures, "item-archive"), alert);
  await confirm.tap();
  await expect(row).toHaveCount(0);
}

test("adds the first item from the empty list and lists it with its summary", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await seed(fixtures, "dev-items-seed-clear", /archived/i);
  await openItemsTab(fixtures);
  await expect(screen.getByTestId("items-empty")).toBeVisible();

  // Act: the empty state's call to action opens the sheet in create mode (#63).
  await tapUntilVisible(
    nativeButton(fixtures, "items-empty-add"),
    screen.getByTestId("item-sheet"),
  );

  // Assert: a new item is created from scratch: the type is chosen, the currency is editable, and there is no
  // "Applies from", because there is nothing to change from yet (#64).
  for (const id of ["item-type", "item-name", "item-amount", "item-repeats", "item-first-month"]) {
    await expect(screen.getByTestId(id)).toBeVisible();
  }
  await expect(screen.getByTestId("item-applies-from")).toHaveCount(0);
  await screen.getByTestId("item-amount-currency").tap();
  await expect(screen.getByTestId("item-amount-currency-PLN")).toBeVisible();
  await screen.getByTestId("item-amount-currency-PLN").tap();
  await settle();
  await app.screenshot("item-form-add");

  // Act
  await typeInto(fixtures, "item-name", "E2E water");
  await typeInto(fixtures, "item-amount", "1234.56");

  // Assert: the plain-language preview of #63, resolved by the engine the forecast uses.
  await expect(screen.getByTestId("item-preview")).toContainText(/Monthly/);
  await expect(screen.getByTestId("item-preview")).toContainText(/Next: /);

  // Act
  await reveal(fixtures, "item-add");
  await nativeButton(fixtures, "item-add").tap();
  await expect(screen.getByTestId("item-sheet")).toHaveCount(0);

  // Assert: the row is listed, named as one sentence with its amount and its summary (#63 accessibility).
  const row = created(screen);
  await expect(row).toHaveAccessibleName(/E2E water, expense, .*1,234\.56.*Monthly/);
  await app.screenshot("items-after-add");

  // Act / Assert: archived again from its own sheet, which leaves the list empty for the next run.
  await archiveFromSheet(fixtures, "E2E water", row);
  await expect(screen.getByTestId("items-empty")).toBeVisible();
});

test("reports the fields the form is missing before it saves", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await seed(fixtures, "dev-items-seed-seed", /written/i);
  await openItemsTab(fixtures);
  // The way in when there is already something to list: the header's "+" on iOS, the floating one on Android.
  await tapUntilVisible(nativeButton(fixtures, "items-add"), screen.getByTestId("item-sheet"));

  // Act: nothing filled in.
  await reveal(fixtures, "item-add");
  await nativeButton(fixtures, "item-add").tap();

  // Assert: how many fields need attention, and which they are (#63).
  await reveal(fixtures, "item-errors-summary");
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
  await reveal(fixtures, "item-cancel");
  await nativeButton(fixtures, "item-cancel").tap();
  const { alert, confirm } = appAlert(
    fixtures,
    "item-discard-dialog",
    "Discard changes?",
    "Discard",
  );
  await expect(alert).toBeVisible();
  await app.screenshot("item-form-discard");

  // Assert: the form is gone and the list is what it was.
  await confirm.tap();
  await expect(screen.getByTestId("item-sheet")).toHaveCount(0);
  await expect(screen.getByTestId(rowID("rent"))).toBeVisible();
});

test("edits a recurring item from a later month, leaving earlier months alone", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  const month = await seed(fixtures, "dev-items-seed-seed", /written/i);
  await openItemsTab(fixtures);
  const rent = screen.getByTestId(rowID("rent"));
  await expect(rent).toHaveAccessibleName(/Rent, expense, .*3,200\.00.*Monthly/);

  // Act: the row itself opens the sheet in edit mode (#82).
  await rent.tap();
  await expect(screen.getByTestId("item-sheet")).toBeVisible();

  // Assert: the type is fixed after creation and the currency is locked, with the reason said (#63, #82).
  await expect(screen.getByTestId("item-type")).toBeVisible();
  await expect(screen.getByTestId("item-amount-currency")).toHaveText(/PLN/);
  await expect(screen.getByTestId("item-amount-currency-EUR")).toHaveCount(0);
  await expect(screen.getByTestId("item-amount-helper")).toHaveText(
    /The currency can't be changed after the item is created\./,
  );
  // A recurring item is edited from a month the user picks, and the hint says what the earlier ones keep (#64).
  await reveal(fixtures, "item-applies-from");
  await expect(screen.getByTestId("item-applies-from")).toBeVisible();
  await expect(screen.getByTestId("item-applies-from-hint")).toContainText(
    /keep their current amount and schedule/,
  );

  // Act: a new amount, starting two months from the active one.
  await typeInto(fixtures, "item-amount", "3500.00");
  const later = monthAfter(month, 2);
  await screen.getByTestId("item-applies-from").tap();
  await expect(screen.getByTestId(`item-applies-from-${month}`)).toBeVisible();
  await screen.getByTestId(`item-applies-from-${later}`).tap();
  await settle();
  await app.screenshot("item-form-applies-from");

  // Act
  await reveal(fixtures, "item-save");
  await nativeButton(fixtures, "item-save").tap();
  await expect(screen.getByTestId("item-sheet")).toHaveCount(0);

  // Assert: this month still shows the amount it had, and the row carries the change that is still to come (#40).
  await expect(rent).toHaveAccessibleName(/Rent, expense, .*3,200\.00.*Change from/);
  await app.screenshot("items-after-scheduled-edit");
});

test("keeps a scheduled change and undoes the choice to replace it", async (fixtures) => {
  // Arrange: the seeded internet has a change already scheduled two months ahead.
  const { app, screen } = fixtures;
  await seed(fixtures, "dev-items-seed-seed", /written/i);
  await openItemsTab(fixtures);
  await screen.getByTestId(rowID("internet")).tap();
  await expect(screen.getByTestId("item-sheet")).toBeVisible();

  // Assert: the live dry run of #64 says a change is scheduled, and offers to replace it.
  await reveal(fixtures, "item-notice-scheduled");
  await expect(screen.getByTestId("item-notice-scheduled")).toBeVisible();
  await expect(screen.getByTestId("item-notice-scheduled-replace")).toBeVisible();
  await app.screenshot("item-form-scheduled-notice");

  // Act
  await reveal(fixtures, "item-notice-scheduled-replace");
  await nativeButton(fixtures, "item-notice-scheduled-replace").tap();

  // Assert: replacing is undone by "Keep the scheduled change" (#64, decision 3).
  await expect(screen.getByTestId("item-notice-scheduled-keep")).toBeVisible();
  await app.screenshot("item-form-scheduled-replaced");

  // Act
  await reveal(fixtures, "item-notice-scheduled-keep");
  await nativeButton(fixtures, "item-notice-scheduled-keep").tap();

  // Assert: back to the choice. Nothing in the form was changed, so the sheet closes at once (#63) and the
  // scheduled change the row shows is the one that was seeded.
  await expect(screen.getByTestId("item-notice-scheduled-replace")).toBeVisible();
  await reveal(fixtures, "item-cancel");
  await nativeButton(fixtures, "item-cancel").tap();
  await expect(screen.getByTestId("item-sheet")).toHaveCount(0);
  await expect(screen.getByTestId(rowID("internet"))).toHaveAccessibleName(/Change from/);
});

test("keeps an amount whole in a currency without minor digits", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  // Seeded first, so a currency one of the rows already uses is offered right after the base one (#61, decision 4).
  await seed(fixtures, "dev-items-seed-seed", /written/i);
  await openItemsTab(fixtures);
  await tapUntilVisible(nativeButton(fixtures, "items-add"), screen.getByTestId("item-sheet"));
  await typeInto(fixtures, "item-name", "E2E manga");

  // Act: the currency the field is counted in, from inside the field (#61, variant A).
  await screen.getByTestId("item-amount-currency").tap();
  await expect(screen.getByTestId("item-amount-currency-JPY")).toBeVisible();
  await screen.getByTestId("item-amount-currency-JPY").tap();

  // Assert: with no rate store yet (#92) the field says there is nothing to convert with, and offers no manual
  // rate either, because that screen (#144, #145) does not exist.
  await expect(screen.getByTestId("item-amount-hint")).toHaveText(/No exchange rate yet/);
  await expect(screen.getByText(/Enter rate manually/)).toHaveCount(0);

  // Act
  await typeInto(fixtures, "item-amount", "1000");

  // Assert: yen has no minor units, so the field holds a whole amount with no decimal separator at all (#61).
  await expect(screen.getByTestId("item-amount")).toHaveValue(/^1[ ,\u00a0.]?000$/);
  await settle();
  await app.screenshot("item-form-jpy");

  // Act
  await reveal(fixtures, "item-add");
  await nativeButton(fixtures, "item-add").tap();
  await expect(screen.getByTestId("item-sheet")).toHaveCount(0);

  // Assert: the listed amount is whole too, and the row still says there is no rate for it.
  const row = created(screen);
  await expect(row).toHaveAccessibleName(/E2E manga, expense, [^,]*1,000,.*No rate yet/);
  await app.screenshot("items-after-jpy-add");

  // Act / Assert: archived again, so the device is left as the run found it.
  await archiveFromSheet(fixtures, "E2E manga", row);
});
