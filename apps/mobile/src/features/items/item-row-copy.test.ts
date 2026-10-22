// The words of an Items list row (#112): the signed amount, the summary line, the "Change from" badge, the
// foreign-currency note and the accessible name, all built from i18n keys rather than concatenated.
import { formatMoney, type MinorUnits, negateMinorUnits, toYearMonth } from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import { itemRowActions, itemRowCopy } from "./item-row-copy";
import type { ItemRow } from "./item-rows";

/**
 * The money text the row is expected to show, built the way `ui/amount.ts` builds it, so the assertion does not
 * depend on how this machine's ICU spells a currency.
 */
const money = (amount: MinorUnits, currency: "PLN" | "JPY") =>
  formatMoney(amount < 0 ? negateMinorUnits(amount) : amount, { lang: "en", currency });

/** The keys the copy asks for, answered with their own name so a test can see which ones and with what. */
const t = (key: string, options?: Record<string, string | number | boolean>) => {
  const values = Object.entries(options ?? {}).map(([name, value]) => `${name}=${value}`);
  return values.length === 0 ? key : `${key}(${values.join(",")})`;
};

const row = (fields: Partial<ItemRow> & Pick<ItemRow, "id">): ItemRow => ({
  name: "Rent",
  itemType: "expense",
  currency: "PLN",
  amount: -320_000 as MinorUnits,
  summary: [{ key: "items.summary.monthly", options: {}, gap: "separator" }],
  changeFrom: undefined,
  foreign: false,
  sortOrder: 1,
  ...fields,
});

describe("itemRowCopy", () => {
  it("asks for the summary and the amount of an ordinary expense row", () => {
    // Arrange
    const expense = row({ id: "rent" });

    // Act
    const copy = itemRowCopy(expense, "en", t);

    // Assert
    expect(copy.meta).toBe("items.summary.monthly");
    expect(copy.amount.text).toBe(`\u2212${money(-320_000 as MinorUnits, "PLN")}`);
    expect(copy.amount.tone).toBe("expense");
    expect(copy.badge).toBeUndefined();
    expect(copy.amountNote).toBeUndefined();
    expect(copy.accessibilityLabel).toContain("name=Rent");
  });

  it("names the scheduled change in the badge and in the accessible name", () => {
    // Arrange: an item whose amount changes in December.
    const expense = row({ id: "internet", changeFrom: toYearMonth("2026-12") });

    // Act
    const copy = itemRowCopy(expense, "en", t);

    // Assert
    expect(copy.badge).toMatch(/^items\.list\.changeFrom\(month=/);
    expect(copy.accessibilityLabel).toMatch(/^items\.a11y\.rowChange\(/);
  });

  it("notes that a foreign item has no rate yet", () => {
    // Arrange
    const foreign = row({
      id: "streaming",
      currency: "JPY",
      amount: -1_500 as MinorUnits,
      foreign: true,
    });

    // Act / Assert: the note appears only for the foreign item.
    const copy = itemRowCopy(foreign, "en", t);

    // Assert
    expect(copy.amountNote).toBe("items.list.noRate");
    expect(copy.amount.text).toBe(`\u2212${money(-1_500 as MinorUnits, "JPY")}`);
    // The note is part of the row's one accessible name, not a separate element.
    expect(copy.accessibilityLabel).toContain("amount=items.a11y.amountNoRate(");
  });

  it("signs income with a plus and reads it as income", () => {
    // Arrange
    const income = row({
      id: "salary",
      itemType: "income",
      amount: 850_000 as MinorUnits,
      foreign: false,
    });

    // Act
    const copy = itemRowCopy(income, "en", t);

    // Assert
    expect(copy.amount.text).toBe(`+${money(850_000 as MinorUnits, "PLN")}`);
    expect(copy.amount.tone).toBe("income");
    expect(copy.accessibilityLabel).toContain("kind=items.a11y.kindIncome");
  });
});

describe("itemRowActions", () => {
  it("offers archiving and nothing else, until #82 adds editing", () => {
    // Arrange / Act
    const actions = itemRowActions(t);

    // Assert
    expect(actions).toEqual([
      { key: "archive", label: "items.actions.archive", destructive: true },
    ]);
  });
});
