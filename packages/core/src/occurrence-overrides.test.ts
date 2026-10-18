import { describe, expect, it } from "vitest";
import {
  type OccurrenceOverride,
  resolveOccurrences,
  type ScheduledItem,
  toMinorUnits,
  toYearMonth,
  validateOverride,
} from "./index";

const ym = toYearMonth;

const monthly = (id: string, name: string, amount: number) => ({
  id,
  name,
  itemType: "expense" as const,
  amount: toMinorUnits(amount),
  schedule: { kind: "recurring" as const, intervalMonths: 1, anchor: ym("2026-01") },
});

const rent = monthly("rent", "Rent", 300_000);
const internet = monthly("internet", "Internet", 7_999);

const amountsIn = (
  items: readonly ScheduledItem[],
  overrides: readonly OccurrenceOverride[],
  month: string,
) => resolveOccurrences(items, overrides, ym(month)).map(({ item, amount }) => [item.id, amount]);

describe("resolveOccurrences", () => {
  it("uses the overridden amount in the override month only", () => {
    // Arrange
    const override: OccurrenceOverride = {
      id: "o1",
      itemType: "expense",
      itemId: "rent",
      month: ym("2026-11"),
      amount: toMinorUnits(320_000),
    };

    // Act
    const november = amountsIn([rent, internet], [override], "2026-11");
    const december = amountsIn([rent, internet], [override], "2026-12");

    // Assert
    expect(november).toEqual([
      ["rent", 320_000],
      ["internet", 7_999],
    ]);
    expect(december).toEqual([
      ["rent", 300_000],
      ["internet", 7_999],
    ]);
  });

  it("leaves out a skipped occurrence", () => {
    // Arrange
    const skip: OccurrenceOverride = {
      id: "o1",
      itemType: "expense",
      itemId: "rent",
      month: ym("2026-11"),
      skipped: true,
    };

    // Act
    const november = amountsIn([rent, internet], [skip], "2026-11");

    // Assert
    expect(november).toEqual([["internet", 7_999]]);
  });

  it("matches overrides by item id and type, so same-name items and incomes are unaffected", () => {
    // Arrange
    const otherRent = monthly("garage", "Rent", 50_000);
    const incomeWithSameId = { ...monthly("rent", "Salary", 900_000), itemType: "income" as const };
    const override: OccurrenceOverride = {
      id: "o1",
      itemType: "expense",
      itemId: "rent",
      month: ym("2026-11"),
      amount: toMinorUnits(320_000),
    };

    // Act
    const november = amountsIn([rent, otherRent, incomeWithSameId], [override], "2026-11");

    // Assert
    expect(november).toEqual([
      ["rent", 320_000],
      ["garage", 50_000],
      ["rent", 900_000],
    ]);
  });

  it("ignores an override for a month in which the item has no occurrence", () => {
    // Arrange
    const ended = { ...rent, schedule: { ...rent.schedule, endMonth: ym("2026-10") } };
    const leftover: OccurrenceOverride = {
      id: "o1",
      itemType: "expense",
      itemId: "rent",
      month: ym("2026-11"),
      amount: toMinorUnits(320_000),
    };

    // Act
    const november = amountsIn([ended], [leftover], "2026-11");

    // Assert
    expect(november).toEqual([]);
  });

  it("rejects two overrides of the same occurrence", () => {
    // Arrange
    const first: OccurrenceOverride = {
      id: "o1",
      itemType: "expense",
      itemId: "rent",
      month: ym("2026-11"),
      skipped: true,
    };
    const second: OccurrenceOverride = { ...first, id: "o2" };

    // Act
    const resolve = () => resolveOccurrences([rent], [first, second], ym("2026-11"));

    // Assert
    expect(resolve).toThrow(RangeError);
  });
});

describe("validateOverride", () => {
  it.each<[string, Partial<OccurrenceOverride>, string[]]>([
    ["neither an amount nor a skip", {}, ["empty-override"]],
    [
      "both an amount and a skip",
      { amount: toMinorUnits(1), skipped: true },
      ["skipped-with-amount"],
    ],
    ["a month without an occurrence", { month: ym("2025-12"), skipped: true }, ["inactive-month"]],
  ])("reports an override with %s", (_case, fields, expected) => {
    // Arrange
    const override: OccurrenceOverride = {
      id: "o1",
      itemType: "expense",
      itemId: "rent",
      month: ym("2026-11"),
      ...fields,
    };

    // Act
    const errors = validateOverride(override, rent);

    // Assert
    expect(errors).toEqual(expected);
  });
});
