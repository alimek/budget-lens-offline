// Business rules of the items and rule-version repository (#81): archive instead of delete, the item's currency
// is fixed after creation, the row-to-core mapping round-trips, and a damaged row is reported instead of dropped.
import {
  type CurrencyCode,
  planRuleEdit,
  type RuleVersion,
  toMinorUnits,
  toYearMonth,
  versionInForce,
} from "@budget-lens/core";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyRuleVersionPlan,
  archiveItem,
  createItem,
  type ItemsRepositoryDeps,
  readItems,
  runMigrations,
  schema,
  updateItem,
} from "../src";
import { item, openTestDatabase, settingsRow } from "./helpers";

const ym = toYearMonth;

const version = (
  effectiveFrom: string,
  amount: number,
  schedule: RuleVersion["schedule"],
): RuleVersion => ({ effectiveFrom: ym(effectiveFrom), amount: toMinorUnits(amount), schedule });

const monthly = (anchor: string): RuleVersion["schedule"] => ({
  kind: "recurring",
  intervalMonths: 1,
  anchor: ym(anchor),
});

const rent = {
  id: "rent",
  kind: "expense" as const,
  name: "Rent",
  versions: [version("2026-01", 250_000, monthly("2026-01"))],
};

/** The base currency is read from `settings`, so the tests set it explicitly. */
function seed(baseCurrency: CurrencyCode = "PLN") {
  db.insert(schema.settings)
    .values({ ...settingsRow(1), baseCurrency })
    .run();
}

let db: ReturnType<typeof openTestDatabase>;
let deps: ItemsRepositoryDeps;
let nextId: number;

beforeEach(() => {
  db = openTestDatabase();
  runMigrations(db);
  nextId = 0;
  deps = {
    now: () => Date.UTC(2026, 9, 21),
    newId: () => {
      nextId += 1;
      return `version-${nextId}`;
    },
  };
});

describe("items repository", () => {
  it("creates an item in the base currency, with amounts as whole minor units", () => {
    // Arrange
    seed("EUR");

    // Act
    const result = createItem(db, rent, deps);

    // Assert
    expect(result).toEqual({ ok: true });
    const { items, invalidItems } = readItems(db);
    expect(invalidItems).toEqual([]);
    expect(items[0]).toMatchObject({
      id: "rent",
      currency: "EUR",
      versions: [{ amount: 250_000 }],
    });
  });

  it("keeps the item's currency and rejects changing it after creation", () => {
    // Arrange: a JPY item, so its amounts are whole yen (ISO exponent 0), never scaled grosze.
    seed("PLN");
    createItem(
      db,
      { ...rent, currency: "JPY", versions: [version("2026-01", 123, monthly("2026-01"))] },
      deps,
    );

    // Act
    const renamed = updateItem(db, "rent", { name: "Studio", currency: "PLN" }, deps);
    const moved = updateItem(db, "rent", { currency: "JPY", sortOrder: 3 }, deps);

    // Assert: the rule versions are amounts in the item's currency, so they keep the 123 unchanged.
    expect(renamed).toEqual({ ok: false, error: { code: "immutable-field", field: "currency" } });
    expect(moved).toEqual({ ok: true });
    const { items } = readItems(db);
    expect(items[0]).toMatchObject({
      name: "Rent",
      sortOrder: 3,
      currency: "JPY",
      versions: [{ amount: 123 }],
    });
  });

  it("archives an item and its versions instead of deleting them, and leaves it out of the list", () => {
    // Arrange
    seed();
    createItem(db, rent, deps);

    // Act
    expect(archiveItem(db, "rent", deps)).toEqual({ ok: true });

    // Assert
    expect(readItems(db).items).toEqual([]);
    const [archived] = readItems(db, { includeArchived: true }).items;
    expect(archived?.archivedAt).toEqual(new Date(Date.UTC(2026, 9, 21)));
    expect(archived?.versions).toHaveLength(1);
    expect(db.select().from(schema.itemRuleVersions).all()).toHaveLength(1);
  });

  it("round-trips one-time and recurring schedules through the columns, including day 31 and the end month", () => {
    // Arrange
    seed();
    createItem(
      db,
      {
        ...rent,
        versions: [
          version("2026-12", 99_000, { kind: "one-time", month: ym("2026-12"), dayOfMonth: 31 }),
        ],
      },
      deps,
    );
    createItem(
      db,
      {
        id: "insurance",
        kind: "expense",
        name: "Insurance",
        sortOrder: 1,
        versions: [
          version("2026-02", 30_000, {
            kind: "recurring",
            intervalMonths: 3,
            anchor: ym("2026-02"),
            endMonth: ym("2027-05"),
            dayOfMonth: 31,
          }),
        ],
      },
      deps,
    );

    // Act
    const { items } = readItems(db);

    // Assert
    expect(items.map((stored) => stored.versions[0]?.schedule)).toEqual([
      { kind: "one-time", month: "2026-12", dayOfMonth: 31 },
      {
        kind: "recurring",
        intervalMonths: 3,
        anchor: "2026-02",
        dayOfMonth: 31,
        endMonth: "2027-05",
      },
    ]);
  });

  it("loads every version of an item so core resolves the right one per month across a change and a year rollover", () => {
    // Arrange
    seed();
    createItem(
      db,
      {
        ...rent,
        versions: [
          version("2027-02", 270_000, monthly("2026-11")),
          version("2026-11", 250_000, monthly("2026-11")),
          version("2026-12", 260_000, monthly("2026-11")),
        ],
      },
      deps,
    );

    // Act
    const versions = readItems(db).items[0]?.versions ?? [];

    // Assert
    expect(versions.map(({ effectiveFrom }) => effectiveFrom)).toEqual([
      "2026-11",
      "2026-12",
      "2027-02",
    ]);
    const amountIn = (month: string) => versionInForce(versions, ym(month))?.amount ?? null;
    expect([
      amountIn("2026-11"),
      amountIn("2026-12"),
      amountIn("2027-01"),
      amountIn("2027-02"),
    ]).toEqual([250_000, 260_000, 260_000, 270_000]);
  });

  it("reports a stored item whose rows pass the SQL CHECKs but fail core validation, and keeps the others", () => {
    // Arrange: an interval above core's maximum and a currency outside the supported set, as restored rows.
    seed();
    createItem(db, rent, deps);
    db.insert(schema.items)
      .values({ ...item("broken"), currency: "XYZ" as CurrencyCode })
      .run();
    db.insert(schema.itemRuleVersions)
      .values({
        id: "broken-version",
        itemId: "broken",
        effectiveFrom: ym("2026-01"),
        amountMinor: toMinorUnits(10_000),
        intervalMonths: 500,
        anchorMonth: ym("2026-01"),
        targetMonth: null,
        dayOfMonth: null,
        endMonth: null,
        createdAt: new Date(0),
      })
      .run();

    // Act
    const { items, invalidItems } = readItems(db);

    // Assert
    expect(items.map((stored) => stored.id)).toEqual(["rent"]);
    expect(invalidItems).toEqual([
      {
        itemId: "broken",
        errors: expect.arrayContaining(["unsupported-currency", "invalid-interval"]),
      },
    ]);
  });

  it("applies a rule edit plan's version changes only, leaving occurrence overrides to #83", () => {
    // Arrange
    seed();
    createItem(
      db,
      {
        ...rent,
        versions: [
          version("2026-01", 250_000, monthly("2026-01")),
          version("2026-06", 300_000, monthly("2026-01")),
        ],
      },
      deps,
    );
    const stored = readItems(db).items[0];
    const result = planRuleEdit(
      {
        item: {
          id: "rent",
          itemType: "expense",
          currency: "PLN",
          versions: stored?.versions ?? [],
        },
        overrides: [
          {
            id: "override-2026-05",
            itemType: "expense",
            itemId: "rent",
            month: ym("2026-05"),
            amount: toMinorUnits(10_000),
          },
        ],
      },
      {
        kind: "change-from",
        from: ym("2026-04"),
        patch: { amount: toMinorUnits(260_000) },
        replaceScheduled: true,
      },
      { activeMonth: ym("2026-04") },
    );
    if (!result.ok) throw new Error(`Rejected: ${result.error.code}`);

    // Act
    expect(applyRuleVersionPlan(db, "rent", result.plan, deps)).toEqual({ ok: true });

    // Assert: upserted and deleted by month, in the item's currency; the override of the plan is not stored.
    expect(readItems(db).items[0]?.versions).toEqual([
      { effectiveFrom: "2026-01", amount: 250_000, schedule: monthly("2026-01") },
      { effectiveFrom: "2026-04", amount: 260_000, schedule: monthly("2026-01") },
    ]);
    expect(db.select().from(schema.occurrenceOverrides).all()).toEqual([]);
  });
});

it("cancels a scheduled change, deleting the scheduled version and keeping the one in force", () => {
  // Arrange: core plans a cancel-scheduled as a delete with nothing to write.
  seed();
  createItem(
    db,
    {
      ...rent,
      versions: [
        version("2026-01", 250_000, monthly("2026-01")),
        version("2027-01", 270_000, monthly("2026-01")),
      ],
    },
    deps,
  );
  const stored = readItems(db).items[0];
  const result = planRuleEdit(
    {
      item: { id: "rent", itemType: "expense", currency: "PLN", versions: stored?.versions ?? [] },
      overrides: [],
    },
    { kind: "cancel-scheduled", versionFrom: ym("2027-01") },
    { activeMonth: ym("2026-04") },
  );
  if (!result.ok) throw new Error(`Rejected: ${result.error.code}`);

  // Act
  expect(applyRuleVersionPlan(db, "rent", result.plan, deps)).toEqual({ ok: true });

  // Assert: the scheduled version is gone, the rule in force is untouched and the item stays active.
  const { items, invalidItems } = readItems(db);
  expect(invalidItems).toEqual([]);
  expect(items).toHaveLength(1);
  expect(items[0]?.archivedAt).toBeNull();
  expect(items[0]?.versions).toEqual([
    { effectiveFrom: "2026-01", amount: 250_000, schedule: monthly("2026-01") },
  ]);
});

it("archives the item when a plan leaves it with no versions at all", () => {
  // Arrange: stopping an item from its own first month deletes its only version (core's no-versions-left).
  seed();
  createItem(db, { ...rent, versions: [version("2026-04", 250_000, monthly("2026-04"))] }, deps);
  const result = planRuleEdit(
    {
      item: {
        id: "rent",
        itemType: "expense",
        currency: "PLN",
        versions: readItems(db).items[0]?.versions ?? [],
      },
      overrides: [],
    },
    { kind: "stop-from", from: ym("2026-04") },
    { activeMonth: ym("2026-04") },
  );
  if (!result.ok) throw new Error(`Rejected: ${result.error.code}`);

  // Act
  expect(applyRuleVersionPlan(db, "rent", result.plan, deps)).toEqual({ ok: true });

  // Assert: archived, not deleted, so history keeps the item; the deleted version itself is gone.
  expect(readItems(db).items).toEqual([]);
  const [archived] = readItems(db, { includeArchived: true }).items;
  expect(archived?.id).toBe("rent");
  expect(archived?.archivedAt).toEqual(new Date(Date.UTC(2026, 9, 21)));
  expect(archived?.versions).toEqual([]);
});
