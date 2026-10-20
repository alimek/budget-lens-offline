import { assert, describe, expect, it } from "vitest";
import {
  addMonths,
  DEFAULT_SETTINGS,
  type ForecastInput,
  forecast,
  type RuleVersion,
  toMinorUnits,
  toYearMonth,
} from "./index";

const START = toYearMonth("2026-12");
const money = toMinorUnits;
const version = (offset: number, amount: number, dayOfMonth = 1): RuleVersion => ({
  effectiveFrom: addMonths(START, offset),
  amount: money(amount),
  schedule: { kind: "recurring", intervalMonths: 1, anchor: START, dayOfMonth },
});
const input = (
  versions: readonly RuleVersion[],
  changes: Partial<ForecastInput> = {},
): ForecastInput => ({
  items: [{ id: "rent", itemType: "expense", currency: "PLN", versions }],
  overrides: [],
  paymentStatuses: [],
  currentBalance: money(2_000_000),
  totalSavings: money(101),
  fromMonth: START,
  months: 6,
  settings: DEFAULT_SETTINGS,
  rates: [],
  ...changes,
});

describe("forecast rule versions", () => {
  it("uses scheduled rent from month +3 and an override in month +4 across a year rollover", () => {
    // Arrange
    const data = input([version(3, 300_000), version(0, 250_000)], {
      overrides: [
        {
          id: "rent-once",
          itemId: "rent",
          itemType: "expense",
          month: addMonths(START, 4),
          amount: money(275_001),
        },
      ],
    });

    // Act
    const result = forecast(data);

    // Assert
    assert(result.ok);
    expect(result.forecast.map(({ expenses }) => expenses)).toEqual([
      250_000, 250_000, 250_000, 300_000, 275_001, 300_000,
    ]);
    expect(result.forecast.map(({ month }) => month)).toEqual([
      "2026-12",
      "2027-01",
      "2027-02",
      "2027-03",
      "2027-04",
      "2027-05",
    ]);
    expect(result.forecast.at(-1)).toMatchObject({ balance: 374_999, totalFunds: 375_100 });
    expect(
      result.forecast.every(({ income, expenses, balance, netChange, totalFunds }) =>
        [income, expenses, balance, netChange, totalFunds].every(Number.isSafeInteger),
      ),
    ).toBe(true);
  });

  it.each([0, 2, 5])(
    "starts an item only when its first version takes effect at offset %i",
    (offset) => {
      // Arrange
      const data = input([version(offset, 123_401)]);

      // Act
      const result = forecast(data);

      // Assert
      assert(result.ok);
      expect(result.forecast.map(({ expenses }) => expenses)).toEqual(
        Array.from({ length: 6 }, (_, index) => (index < offset ? 0 : 123_401)),
      );
    },
  );

  it.each([
    [1, 31],
    [31, 1],
  ])(
    "keeps monthly payments across February when the payment day changes from %i to %i",
    (before, after) => {
      // Arrange
      const data = input([version(0, 10_001, before), version(2, 20_003, after)], { months: 4 });

      // Act
      const result = forecast(data);

      // Assert
      assert(result.ok);
      expect(result.forecast.map(({ expenses }) => expenses)).toEqual([
        10_001, 10_001, 20_003, 20_003,
      ]);
    },
  );

  it("preserves quarterly rhythm and ignores overrides in months no longer scheduled", () => {
    // Arrange
    const data = input(
      [
        version(0, 100),
        {
          ...version(1, 201),
          schedule: {
            kind: "recurring",
            anchor: START,
            intervalMonths: 3,
            endMonth: addMonths(START, 4),
          },
        },
      ],
      {
        overrides: [
          {
            id: "inactive",
            itemId: "rent",
            itemType: "expense",
            month: addMonths(START, 1),
            amount: money(999),
          },
          {
            id: "skip",
            itemId: "rent",
            itemType: "expense",
            month: addMonths(START, 3),
            skipped: true,
          },
        ],
      },
    );

    // Act
    const result = forecast(data);

    // Assert
    assert(result.ok);
    expect(result.forecast.map(({ expenses }) => expenses)).toEqual([100, 0, 0, 0, 0, 0]);
  });

  it("leaves months before a scheduled change unchanged and projects only from the active month", () => {
    // Arrange
    const original = [version(-2, 100_001)];
    const changed = [...original, version(0, 200_003)];
    const historyInput = { fromMonth: addMonths(START, -2), months: 2 };
    const previous = forecast(input(original, historyInput));
    const data = input(changed);
    const unchangedInput = JSON.stringify(data);

    // Act
    const history = forecast(input(changed, historyInput));
    const active = forecast(data);

    // Assert
    expect(history).toEqual(previous);
    expect(JSON.stringify(data)).toBe(unchangedInput);
    assert(active.ok);
    expect(active.forecast[0]).toMatchObject({ month: START, expenses: 200_003 });
    expect(active.forecast).toHaveLength(6);
  });

  it.each([
    [],
    [version(0, 100), version(0, 200)],
    [{ ...version(0, 100), amount: Number.NaN as RuleVersion["amount"] }],
    [
      {
        ...version(0, 100),
        schedule: { kind: "recurring" as const, anchor: START, intervalMonths: 0 },
      },
    ],
  ])("rejects invalid stored versions without returning partial totals: %j", (...versions) => {
    // Arrange
    const data = input(versions);

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "invalid-item", itemId: "rent" } });
  });
});
