// The Items list (#112) on a development build: the empty state, the seeded list with its summaries, the foreign
// row without a rate, the scheduled change, and archiving a row into the archived list. The rows come from the
// development seeder through the real repository, so the list is read exactly as a user's would be.
import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import {
  appAlert,
  type Fixtures,
  nativeButton,
  openDevScreen,
  settle,
  swipeRowLeft,
  tapUntilVisible,
} from "./support/showcase";

// The seeder writes `dev-seed-<gen>-<slug>` ids, so every run gets rows of its own and its "clear" archives what
// an earlier run left behind. The test devices run in English (docs/testing.md).
const gen = Date.now();
const rowID = (slug: string) => `items-row-dev-seed-${gen}-${slug}`;

/** Runs one button of the development seeder and waits for the line it reports. */
async function seed(fixtures: Fixtures, button: string, result: RegExp) {
  const { screen } = fixtures;
  await openDevScreen(fixtures, `items-seed?gen=${gen}`, "screen-dev-items-seed");
  await nativeButton(fixtures, button).tap();
  await expect(screen.getByTestId("dev-items-seed-result")).toHaveText(result);
}

/** The Items tab, over a cold start: what the seeder wrote is read back through the live read. */
async function openItemsTab({ app, device, screen }: Fixtures) {
  await device.closeApp();
  await app.open();
  await expect(screen.getByTestId("screen-home")).toBeVisible();
  await tapUntilVisible(screen.getByTestId("tab-items"), screen.getByTestId("screen-items"));
}

test("shows the empty state while no item is active", async (fixtures) => {
  // Arrange
  const { app } = fixtures;
  await seed(fixtures, "dev-items-seed-clear", /archived/i);

  // Act
  await openItemsTab(fixtures);

  // Assert
  await expect(fixtures.screen.getByTestId("items-empty")).toBeVisible();
  await expect(fixtures.screen.getByTestId("items-section-income")).toHaveCount(0);
  // The way in stays available even with nothing to list.
  await expect(fixtures.screen.getByTestId("items-open-archived")).toBeVisible();
  await app.screenshot("items-empty");
});

test("lists the seeded items with their recurrence summaries", async (fixtures) => {
  // Arrange
  const { app, device, screen } = fixtures;
  await seed(fixtures, "dev-items-seed-seed", /written/i);
  // The seeder screen also shows what this platform's Hermes makes of a month name (#63, decision 5): only the
  // nominative comes from native `Intl`, and Hermes ships its own `Intl` build. February is the odd one out.
  await expect(screen.getByTestId("dev-month-cases")).toHaveText(
    "luty 2027 · lutego 2027 · lutym 2027 · lutym 2027",
  );
  await openItemsTab(fixtures);

  // Assert
  await expect(screen.getByTestId("items-list")).toBeVisible();
  await expect(screen.getByTestId("items-section-income")).toBeVisible();
  await expect(screen.getByTestId("items-section-expenses")).toBeVisible();
  // One element per row: name, kind, signed amount and summary, as one sentence (#63 accessibility).
  await expect(screen.getByTestId(rowID("rent"))).toHaveAccessibleName(
    /Rent, expense, .*Monthly.*on the 10th/,
  );
  await expect(screen.getByTestId(rowID("salary"))).toHaveAccessibleName(
    /Salary, income, \+.*Monthly.*on the 5th/,
  );
  // A foreign item has no rate to convert with yet (#92), and the row says so.
  await expect(screen.getByTestId(rowID("streaming"))).toHaveAccessibleName(/No rate yet/);
  // The first change scheduled after this month is the row's badge.
  await expect(screen.getByTestId(rowID("internet"))).toHaveAccessibleName(/Change from/);
  await app.screenshot("items-list");

  // Act: the same list in dark mode, for the evidence
  await device.setAppearance("dark");
  await settle();

  // Assert
  await expect(screen.getByTestId(rowID("rent"))).toBeVisible();
  await app.screenshot("items-list-dark");
  await device.setAppearance("light");
});

test("archives a row after its confirmation and lists it as archived", async (fixtures) => {
  // Arrange
  const { app, screen } = fixtures;
  await seed(fixtures, "dev-items-seed-seed", /written/i);
  await openItemsTab(fixtures);
  const rent = screen.getByTestId(rowID("rent"));
  const archive = nativeButton(fixtures, `${rowID("rent")}-archive`);
  await swipeRowLeft(screen, rent, "items-list");

  // Act
  const { alert, confirm } = appAlert(
    fixtures,
    "item-archive-dialog",
    "Archive “Rent”?",
    "Archive",
  );
  await tapUntilVisible(archive, alert);
  await settle();
  await app.screenshot("items-archive-dialog");
  await confirm.tap();

  // Assert: the live read drops the row, and nothing else goes with it
  await expect(rent).toHaveCount(0);
  await expect(screen.getByTestId(rowID("salary"))).toBeVisible();

  // Act: the archived list
  await tapUntilVisible(
    screen.getByTestId("items-open-archived"),
    screen.getByTestId("screen-items-archived"),
  );

  // Assert
  const archived = screen.getByTestId(`items-archived-row-dev-seed-${gen}-rent`);
  if (!(await archived.isVisible())) await screen.scrollUntilVisible(archived);
  await expect(archived).toBeVisible();
  await expect(archived).toHaveAccessibleName(/Rent/);
  await app.screenshot("items-archived");
});
