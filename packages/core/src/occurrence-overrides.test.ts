import { describe, expect, it } from "vitest";
import {
  findOrphanedOverrides,
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
) =>
  resolveOccurrences(items, overrides, ym(month)).occurrences.map(({ item, amount }) => [
    item.id,
    amount,
  ]);

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

  it("skips and reports malformed and duplicate stored overrides instead of failing the month", () => {
    // Arrange: rows as they may come from a corrupt database or a JSON backup.
    const withoutSchedule: ScheduledItem = JSON.parse(
      JSON.stringify({ ...monthly("gym", "Gym", 12_000), schedule: null }),
    );
    const base = { itemType: "expense", itemId: "rent", month: "2026-11" };
    const stored = JSON.parse(
      JSON.stringify([
        { ...base, id: "valid", amount: 320_000 },
        null,
        { ...base, id: "fraction", itemId: "internet", amount: 1.5 },
        { ...base, id: "negative", itemId: "internet", amount: -5_000 },
        { ...base, id: "string-flag", itemId: "internet", skipped: "true" },
        { ...base, id: "bad-month", month: "2026-1", skipped: true },
        { ...base, id: "dup-1", month: "2026-12", skipped: true },
        { ...base, id: "dup-2", month: "2026-12", amount: 1 },
      ]),
    );

    // Act
    const { occurrences, rejectedOverrides, invalidItems } = resolveOccurrences(
      [rent, internet, withoutSchedule],
      stored,
      ym("2026-11"),
    );

    // Assert
    expect(occurrences.map(({ item, amount }) => [item.id, amount])).toEqual([
      ["rent", 320_000],
      ["internet", 7_999],
    ]);
    expect(rejectedOverrides.map(({ errors }) => errors)).toEqual([
      ["invalid-override"],
      ["invalid-amount"],
      ["invalid-amount"],
      ["invalid-skipped", "empty-override"],
      ["invalid-month"],
      ["duplicate-override"],
      ["duplicate-override"],
    ]);
    expect(invalidItems).toEqual([withoutSchedule]);
  });
});

describe("findOrphanedOverrides", () => {
  it("reports overrides of an unknown item, a one-time item or a month without occurrence, which resolving ignores", () => {
    // Arrange: rent ends in October; the "deleted" item no longer exists; the TV is a one-time item.
    const tv: ScheduledItem = {
      id: "tv",
      itemType: "expense",
      amount: toMinorUnits(200_000),
      schedule: { kind: "one-time", month: ym("2026-11") },
    };
    const ended = { ...rent, schedule: { ...rent.schedule, endMonth: ym("2026-10") } };
    const afterEnd: OccurrenceOverride = {
      id: "o1",
      itemType: "expense",
      itemId: "rent",
      month: ym("2026-11"),
      amount: toMinorUnits(320_000),
    };
    const ofDeleted: OccurrenceOverride = { ...afterEnd, id: "o2", itemId: "deleted" };
    const ofOneTime: OccurrenceOverride = {
      ...afterEnd,
      id: "o3",
      itemId: "tv",
      amount: toMinorUnits(1),
    };
    const overrides = [afterEnd, ofDeleted, ofOneTime];

    // Act
    const orphans = findOrphanedOverrides([ended, tv], overrides);
    const november = resolveOccurrences([ended, tv], overrides, ym("2026-11"));

    // Assert
    expect(orphans).toEqual([
      { override: afterEnd, reason: "no-occurrence" },
      { override: ofDeleted, reason: "unknown-item" },
      { override: ofOneTime, reason: "one-time-item" },
    ]);
    expect(november.occurrences.map(({ item, amount }) => [item.id, amount])).toEqual([
      ["tv", 200_000],
    ]);
    expect(november.rejectedOverrides).toEqual([]);
  });
});

describe("validateOverride", () => {
  it("reports a null override instead of throwing", () => {
    // Arrange
    const override: OccurrenceOverride = JSON.parse("null");

    // Act
    const errors = validateOverride(override, rent);

    // Assert
    expect(errors).toEqual(["invalid-override"]);
  });

  const laptop: ScheduledItem = {
    id: "rent",
    itemType: "expense",
    amount: toMinorUnits(600_000),
    schedule: { kind: "one-time", month: ym("2026-11") },
  };
  const broken = { ...rent, schedule: { ...rent.schedule, intervalMonths: 0 } };
  const withoutSchedule: ScheduledItem = JSON.parse(JSON.stringify({ ...rent, schedule: null }));

  it.each<[string, Record<string, unknown>, ScheduledItem, string[]]>([
    ["neither an amount nor a skip", {}, rent, ["empty-override"]],
    ["both an amount and a skip", { amount: 1, skipped: true }, rent, ["skipped-with-amount"]],
    [
      "a month without an occurrence",
      { month: "2025-12", skipped: true },
      rent,
      ["inactive-month"],
    ],
    ["another item", { itemId: "internet", skipped: true }, rent, ["item-mismatch"]],
    ["a fractional amount", { amount: 1.5 }, rent, ["invalid-amount"]],
    ["a negative amount", { amount: -1 }, rent, ["invalid-amount"]],
    ["a month that does not exist", { month: "2026-13", skipped: true }, rent, ["invalid-month"]],
    ["a one-time item", { skipped: true }, laptop, ["one-time-item"]],
    ["an item with an invalid schedule", { skipped: true }, broken, ["invalid-schedule"]],
    ["an item without a schedule", { skipped: true }, withoutSchedule, ["invalid-schedule"]],
  ])("reports an override with %s", (_case, fields, item, expected) => {
    // Arrange
    const override = {
      id: "o1",
      itemType: "expense",
      itemId: "rent",
      month: "2026-11",
      ...fields,
    } as OccurrenceOverride;

    // Act
    const errors = validateOverride(override, item);

    // Assert
    expect(errors).toEqual(expected);
  });
});
