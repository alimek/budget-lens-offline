// The Items list model (#112): which version a row shows, what it is worth, and in which order the sections show it.
import {
  type CurrencyCode,
  DEFAULT_SETTINGS,
  type MinorUnits,
  toYearMonth,
} from "@budget-lens/core";
import type { StoredItem } from "@budget-lens/db";
import { describe, expect, it } from "vitest";
import { itemSections, listFromReads, listItems, type Read } from "./item-rows";

const activeMonth = toYearMonth("2026-10");
const context = { activeMonth, lang: "en", baseCurrency: "PLN" } as const;

const item = (
  fields: Partial<StoredItem> &
    Pick<StoredItem, "id" | "name"> & {
      /** Shorthand for a single monthly version at this amount, the usual case. */
      amount?: MinorUnits;
    },
): StoredItem => {
  const { amount, ...rest } = fields;
  return {
    itemType: "expense",
    currency: "PLN",
    note: null,
    sortOrder: 0,
    archivedAt: null,
    versions: [
      {
        effectiveFrom: toYearMonth("2026-01"),
        amount: (amount ?? 1000) as MinorUnits,
        schedule: { kind: "recurring", intervalMonths: 1, anchor: toYearMonth("2026-01") },
      },
    ],
    ...rest,
  };
};

describe("itemSections", () => {
  it("puts income before expenses", () => {
    // Arrange
    const items = [
      item({ id: "rent", name: "Rent" }),
      item({ id: "salary", name: "Salary", itemType: "income" }),
    ];

    // Act
    const sections = itemSections(items, context);

    // Assert
    expect(sections.income.map((row) => row.id)).toEqual(["salary"]);
    expect(sections.expenses.map((row) => row.id)).toEqual(["rent"]);
  });

  it("orders a section by sort_order and then by name", () => {
    // Arrange: `sortOrder` decides first, and items that share it fall back to the name.
    const items = [
      item({ id: "b", name: "Bank fee", sortOrder: 2 }),
      item({ id: "z", name: "Zoo", sortOrder: 1 }),
      item({ id: "a", name: "Electricity", sortOrder: 1 }),
    ];

    // Act
    const sections = itemSections(items, context);

    // Assert
    expect(sections.expenses.map((row) => row.id)).toEqual(["a", "z", "b"]);
  });

  it("signs the amount by kind and keeps grosze whole", () => {
    // Arrange: 3 200,00 zl of rent and 8 500,00 zl of salary.
    const items = [
      item({ id: "rent", name: "Rent", amount: 320_000 as MinorUnits }),
      item({ id: "salary", name: "Salary", itemType: "income", amount: 850_000 as MinorUnits }),
    ];

    // Act
    const sections = itemSections(items, context);

    // Assert
    expect(sections.expenses[0]?.amount).toBe(-320_000);
    expect(sections.income[0]?.amount).toBe(850_000);
  });

  it("shows the version in force and badges the first scheduled change", () => {
    // Arrange: 1 000 since January, 1 200 from December.
    const items = [
      item({
        id: "internet",
        name: "Internet",
        versions: [
          {
            effectiveFrom: toYearMonth("2026-01"),
            amount: 1000 as MinorUnits,
            schedule: { kind: "recurring", intervalMonths: 1, anchor: toYearMonth("2026-01") },
          },
          {
            effectiveFrom: toYearMonth("2026-12"),
            amount: 1200 as MinorUnits,
            schedule: { kind: "recurring", intervalMonths: 1, anchor: toYearMonth("2026-01") },
          },
        ],
      }),
    ];

    // Act
    const [row] = itemSections(items, context).expenses;

    // Assert
    expect(row?.amount).toBe(-1000);
    expect(row?.changeFrom).toEqual(toYearMonth("2026-12"));
  });

  it("shows the first version and no badge for an item that only starts later", () => {
    // Arrange
    const items = [
      item({
        id: "kindergarten",
        name: "Kindergarten",
        versions: [
          {
            effectiveFrom: toYearMonth("2027-01"),
            amount: 80_000 as MinorUnits,
            schedule: { kind: "recurring", intervalMonths: 1, anchor: toYearMonth("2027-01") },
          },
          {
            effectiveFrom: toYearMonth("2027-06"),
            amount: 90_000 as MinorUnits,
            schedule: { kind: "recurring", intervalMonths: 1, anchor: toYearMonth("2027-01") },
          },
        ],
      }),
    ];

    // Act
    const [row] = itemSections(items, context).expenses;

    // Assert: the summary already says the month it starts from.
    expect(row?.amount).toBe(-80_000);
    expect(row?.changeFrom).toBeUndefined();
    expect(row?.summary.map((part) => part.key)).toContain("summary.from");
  });

  it("marks a foreign item against the base currency and keeps its own", () => {
    // Arrange: a JPY item in a PLN budget (JPY has no minor unit of its own).
    const items = [item({ id: "streaming", name: "Streaming", currency: "JPY" as CurrencyCode })];

    // Act
    const [row] = itemSections(items, context).expenses;

    // Assert
    expect(row?.currency).toBe("JPY");
    expect(row?.foreign).toBe(true);
    expect(itemSections(items, { ...context, baseCurrency: "JPY" }).expenses[0]?.foreign).toBe(
      false,
    );
  });
});

describe("listItems", () => {
  const read = {
    items: [
      item({ id: "rent", name: "Rent" }),
      item({ id: "old", name: "Old phone", archivedAt: new Date(0) }),
      item({ id: "salary", name: "Salary", itemType: "income" }),
    ],
    invalidItems: [],
  };

  it("lists the active items and hides the archived ones", () => {
    // Arrange / Act
    const listed = listItems(read, context);

    // Assert
    expect(listed.sections.income.map((row) => row.id)).toEqual(["salary"]);
    expect(listed.sections.expenses.map((row) => row.id)).toEqual(["rent"]);
    expect(listed.empty).toBe(false);
    // The archived row of the list still counts what is behind it (#63).
    expect(listed.archivedCount).toBe(1);
  });

  it("lists only the archived items when asked for them", () => {
    // Arrange / Act
    const listed = listItems(read, { ...context, onlyArchived: true });

    // Assert
    expect(listed.sections.expenses.map((row) => row.id)).toEqual(["old"]);
    expect(listed.sections.income).toEqual([]);
  });

  it("reports unreadable items and an empty list", () => {
    // Arrange: a read with nothing usable in it, which is what a fresh database looks like.
    const nothing = {
      items: [],
      invalidItems: [{ itemId: "x", errors: ["no-versions" as const] }],
    };

    // Act
    const listed = listItems(nothing, context);

    // Assert
    expect(listed.empty).toBe(true);
    expect(listed.hasInvalidItems).toBe(true);
  });

  it("holds the empty state back until the first read has landed", () => {
    // Arrange / Act: a screen that has not read anything yet is not an empty list.
    const listed = listItems(undefined, context);

    // Assert
    expect(listed.empty).toBe(false);
    expect(listed.sections).toEqual({ income: [], expenses: [] });
    expect(listed.hasInvalidItems).toBe(false);
  });
});

describe("listFromReads", () => {
  const items = {
    items: [item({ id: "rent", name: "Rent", amount: 320_000 as MinorUnits })],
    invalidItems: [],
  };
  const landed = <T>(value: T): Read<T> => ({ status: "ready", value });
  const reads = {
    items: landed(items),
    settings: landed(DEFAULT_SETTINGS),
    month: landed(activeMonth),
    lang: "en",
    archived: false,
  } as const;

  it("lists nothing and no empty state while a read is still running", () => {
    // Arrange
    const pending = { ...reads, items: { status: "loading", value: undefined } } as const;

    // Act
    const list = listFromReads(pending);

    // Assert
    expect(list.status).toBe("loading");
    expect(list.sections.income).toEqual([]);
    expect(list.empty).toBe(false);
  });

  it("asks for a retry when the month cannot be read, instead of anchoring to the device month", () => {
    // Arrange: a failed `months` read, with the items and the settings in hand.
    const failed = { ...reads, month: { status: "error", value: undefined } } as const;

    // Act
    const list = listFromReads(failed);

    // Assert: the list of October is not shown anchored to some other month.
    expect(list.status).toBe("error");
    expect(list.sections.expenses).toEqual([]);
  });

  it("asks for a retry when the settings cannot be read, instead of assuming the default currency", () => {
    // Arrange: with a guessed base currency a foreign item would be wrongly marked as one.
    const failed = { ...reads, settings: { status: "error", value: undefined } } as const;

    // Act / Assert
    expect(listFromReads(failed).status).toBe("error");
  });

  it("uses the default currency for a settings read that found no row", () => {
    // Arrange: a fresh database, where the settings read succeeded and found nothing.
    const fresh = { ...reads, settings: { status: "ready", value: undefined } } as const;

    // Act
    const list = listFromReads(fresh);

    // Assert: the list is shown, and a PLN item is not foreign against the core default.
    expect(list.status).toBe("ready");
    expect(list.sections.expenses[0]?.foreign).toBe(false);
  });
});
