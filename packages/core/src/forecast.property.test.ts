import fc from "fast-check";
import { assert, describe, expect, it } from "vitest";
import {
  addMonths,
  DEFAULT_SETTINGS,
  forecast,
  itemInForce,
  type RuleVersion,
  type Schedule,
  toMinorUnits,
  toYearMonth,
} from "./index";

const START = toYearMonth("2026-12");
const amount = fc.integer({ min: 0, max: 10_000_000 }).map(toMinorUnits);
const month = fc.integer({ min: -3, max: 15 }).map((offset) => addMonths(START, offset));
const schedule: fc.Arbitrary<Schedule> = fc.oneof(
  fc.record({
    kind: fc.constant("one-time" as const),
    month,
    dayOfMonth: fc.integer({ min: 1, max: 31 }),
  }),
  fc
    .record({
      kind: fc.constant("recurring" as const),
      anchor: month,
      intervalMonths: fc.integer({ min: 1, max: 12 }),
      dayOfMonth: fc.integer({ min: 1, max: 31 }),
      endOffset: fc.option(fc.integer({ min: 0, max: 24 }), { nil: undefined }),
    })
    .map(({ endOffset, ...schedule }) => ({
      ...schedule,
      ...(endOffset === undefined ? {} : { endMonth: addMonths(schedule.anchor, endOffset) }),
    })),
);
const version: fc.Arbitrary<RuleVersion> = fc.record({ effectiveFrom: month, amount, schedule });
const scenario = fc.record({
  versions: fc.uniqueArray(version, {
    minLength: 1,
    maxLength: 6,
    selector: ({ effectiveFrom }) => effectiveFrom,
  }),
  itemType: fc.constantFrom("income" as const, "expense" as const),
  currentBalance: amount,
  totalSavings: amount,
  overrides: fc.uniqueArray(fc.record({ month, amount, skipped: fc.boolean() }), {
    maxLength: 8,
    selector: ({ month }) => month,
  }),
});

describe("forecast properties", () => {
  it("matches forecasting each month with its item in force, including overrides and whole-grosz balances", () => {
    // Arrange
    const property = fc.property(
      scenario,
      ({ versions, itemType, currentBalance, totalSavings, overrides }) => {
        const item = { id: "item", itemType, currency: "PLN" as const, versions };
        const data = {
          items: [item],
          overrides: overrides.map(({ month, amount, skipped }) => ({
            id: `override-${month}`,
            itemId: item.id,
            itemType,
            month,
            ...(skipped ? { skipped } : { amount }),
          })),
          paymentStatuses: [],
          fromMonth: START,
          months: 12,
          currentBalance,
          totalSavings,
          settings: DEFAULT_SETTINGS,
          rates: [],
        };

        // Act
        const result = forecast(data);

        // Assert
        assert(result.ok);
        let balance = currentBalance;
        for (const row of result.forecast) {
          const resolved = itemInForce(item, row.month);
          const single = forecast({
            ...data,
            items: resolved === undefined ? [] : [resolved],
            fromMonth: row.month,
            months: 1,
            currentBalance: balance,
          });
          assert(single.ok);
          expect(row).toEqual(single.forecast[0]);
          expect(
            [row.income, row.expenses, row.netChange, row.balance, row.totalFunds].every(
              Number.isSafeInteger,
            ),
          ).toBe(true);
          balance = row.balance;
        }
      },
    );
    fc.assert(property);
  });
});
