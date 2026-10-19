import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  type ForecastInput,
  type ForecastItem,
  type ForecastRate,
  forecast,
  toMinorUnits,
  toYearMonth,
} from "./index";

const START = toYearMonth("2026-12");
const NEXT = toYearMonth("2027-01");
const money = toMinorUnits;
const item = (
  id: string,
  itemType: ForecastItem["itemType"],
  amount: number,
  currency: ForecastItem["currency"] = "PLN",
): ForecastItem => ({
  id,
  itemType,
  amount: money(amount),
  currency,
  schedule: { kind: "recurring", intervalMonths: 1, anchor: START },
});
const input = (changes: Partial<ForecastInput> = {}): ForecastInput => ({
  items: [],
  overrides: [],
  paymentStatuses: [],
  currentBalance: money(0),
  totalSavings: money(0),
  fromMonth: START,
  settings: DEFAULT_SETTINGS,
  rates: [],
  ...changes,
});
const eur: ForecastRate = {
  currency: "EUR",
  mid: "4.3661",
  effectiveDate: "2026-10-16",
  source: "nbp",
  stale: false,
};

describe("forecast", () => {
  it("rolls across a year, applies overrides and skips, and ignores future payment statuses", () => {
    // Arrange
    const data = input({
      items: [item("shared", "income", 1000), item("shared", "expense", 300)],
      currentBalance: money(2000),
      totalSavings: money(500),
      settings: { ...DEFAULT_SETTINGS, forecastHorizonMonths: 3 },
      paymentStatuses: [
        { itemId: "shared", itemType: "expense", month: START, settled: true },
        { itemId: "shared", itemType: "income", month: START, settled: true },
        { itemId: "shared", itemType: "income", month: NEXT, settled: true },
      ],
      overrides: [
        { id: "override", itemId: "shared", itemType: "expense", month: NEXT, amount: money(500) },
        {
          id: "skip",
          itemId: "shared",
          itemType: "income",
          month: toYearMonth("2027-02"),
          skipped: true,
        },
      ],
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      forecast: [
        { month: START, income: 0, expenses: 0, netChange: 0, balance: 2000, totalFunds: 2500 },
        {
          month: NEXT,
          income: 1000,
          expenses: 500,
          netChange: 500,
          balance: 2500,
          totalFunds: 3000,
        },
        {
          month: "2027-02",
          income: 0,
          expenses: 300,
          netChange: -300,
          balance: 2200,
          totalFunds: 2700,
        },
      ],
    });
  });

  it("keeps expense and income payment keys separate, including false and other-month statuses", () => {
    // Arrange
    const data = input({
      months: 1,
      items: [item("shared", "income", 1000), item("shared", "expense", 300)],
      paymentStatuses: [
        { itemType: "income", itemId: "shared", month: START, settled: true },
        { itemType: "expense", itemId: "shared", month: START, settled: false },
        { itemType: "expense", itemId: "shared", month: NEXT, settled: true },
      ],
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      forecast: [{ income: 0, expenses: 300, balance: -300 }],
    });
  });

  it.each([
    [-1, "negative-balance", "critical"],
    [0, "low-balance", "caution"],
    [99, "low-balance", "caution"],
    [100, undefined, undefined],
  ] as const)("uses the configured low-balance boundary at %s", (balance, code, type) => {
    // Arrange
    const data = input({
      months: 1,
      currentBalance: money(balance),
      settings: { ...DEFAULT_SETTINGS, lowBalanceThreshold: money(100) },
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings.map((warning) => [warning.code, warning.type])).toEqual(
      code === undefined ? [] : [[code, type]],
    );
    if (code !== undefined)
      expect(result.warnings[0]?.params).toEqual({
        amount: balance,
        threshold: balance < 0 ? 0 : 100,
        currency: "PLN",
        monthsAhead: 1,
      });
  });

  it.each([
    [100, false],
    [101, true],
  ] as const)("warns only beyond the large-outflow threshold: %s", (amount, warns) => {
    // Arrange
    const data = input({
      months: 1,
      currentBalance: money(1000),
      items: [item("bill", "expense", amount)],
      settings: {
        ...DEFAULT_SETTINGS,
        lowBalanceThreshold: money(0),
        largeExpenseThreshold: money(100),
      },
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      warnings: warns
        ? [{ code: "large-outflow", type: "info", params: { amount, threshold: 100 } }]
        : [],
    });
  });

  it("keeps critical and outflow warnings together, with zero thresholds still active", () => {
    // Arrange
    const data = input({
      months: 1,
      items: [item("bill", "expense", 1)],
      settings: {
        ...DEFAULT_SETTINGS,
        lowBalanceThreshold: money(0),
        largeExpenseThreshold: money(0),
      },
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      warnings: [{ code: "negative-balance" }, { code: "large-outflow" }],
    });
  });

  it("converts mixed EUR and JPY items per row before summing in PLN, after overrides", () => {
    // Arrange
    const data = input({
      months: 2,
      items: [
        item("rent", "expense", 10000, "EUR"),
        item("yen", "income", 10000, "JPY"),
        item("tiny1", "income", 1, "EUR"),
        item("tiny2", "income", 1, "EUR"),
      ],
      overrides: [
        {
          id: "rent-change",
          itemId: "rent",
          itemType: "expense",
          month: START,
          amount: money(20000),
        },
      ],
      rates: [eur, { ...eur, currency: "JPY", mid: "0.024574" }],
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      currency: "PLN",
      forecast: [
        { income: 24582, expenses: 87322, balance: -62740 },
        { income: 24582, expenses: 43661, balance: -81819 },
      ],
      ratesUsed: [eur, { currency: "JPY", mid: "0.024574" }],
    });
  });

  it("converts PLN items into an EUR base and selects the newer candidate, manual on ties", () => {
    // Arrange
    const data = input({
      months: 1,
      items: [item("pln", "income", 10000)],
      settings: { ...DEFAULT_SETTINGS, baseCurrency: "EUR", trackedCurrencies: [] },
      rates: [
        { ...eur, mid: "4", source: "manual", stale: true },
        { ...eur, effectiveDate: "2026-10-15", mid: "3" },
        eur,
      ],
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      currency: "EUR",
      forecast: [{ income: 2500 }],
      ratesUsed: [{ source: "manual", mid: "4", stale: true }],
    });
  });

  it("requires the non-PLN base leg and exposes both legs for a cross conversion", () => {
    // Arrange
    const data = input({
      months: 1,
      items: [item("usd", "income", 10000, "USD")],
      settings: { ...DEFAULT_SETTINGS, baseCurrency: "EUR", trackedCurrencies: [] },
      rates: [eur, { ...eur, currency: "USD", mid: "3.8827", stale: true }],
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      forecast: [{ income: 8893 }],
      ratesUsed: [
        { currency: "USD", stale: true },
        { currency: "EUR", stale: false },
      ],
    });
  });

  it("reports a missing base leg instead of mixing foreign amounts", () => {
    // Arrange
    const data = input({
      months: 1,
      items: [item("pln", "income", 100)],
      settings: { ...DEFAULT_SETTINGS, baseCurrency: "EUR", trackedCurrencies: [] },
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "missing-rate", currency: "EUR" } });
  });

  it("prefers newer NBP over an older manual rate for every projected month", () => {
    // Arrange
    const data = input({
      months: 2,
      items: [item("eur", "income", 10000, "EUR")],
      rates: [{ ...eur, source: "manual", effectiveDate: "2026-10-15", mid: "1" }, eur],
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      forecast: [{ income: 43661 }, { income: 43661 }],
      ratesUsed: [eur],
    });
  });

  it("requires no rate for paid, skipped, inactive or base-currency occurrences", () => {
    // Arrange
    const data = input({
      months: 1,
      items: [
        item("paid", "income", 100, "EUR"),
        item("skip", "expense", 100, "JPY"),
        { ...item("later", "income", 100, "USD"), schedule: { kind: "one-time", month: NEXT } },
        item("base", "income", 10),
      ],
      paymentStatuses: [{ itemType: "income", itemId: "paid", month: START, settled: true }],
      overrides: [{ id: "skip", itemType: "expense", itemId: "skip", month: START, skipped: true }],
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({ ok: true, forecast: [{ income: 10 }], ratesUsed: [] });
  });

  it.each([undefined, "0", "1e-2"])(
    "reports missing or invalid needed rates without returning partial totals: %s",
    (mid) => {
      // Arrange
      const data = input({
        items: [item("eur", "income", 100, "EUR")],
        rates: mid === undefined ? [] : [{ ...eur, mid }],
      });

      // Act
      const result = forecast(data);

      // Assert
      expect(result).toEqual({
        ok: false,
        error: { code: mid === undefined ? "missing-rate" : "invalid-rate", currency: "EUR" },
      });
    },
  );

  it.each([0, 121, 1.5])("rejects an invalid explicit horizon: %s", (months) => {
    // Arrange
    const data = input({ months });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "invalid-horizon" } });
  });

  it("rejects a horizon outside the calendar range", () => {
    // Arrange
    const data = input({ fromMonth: toYearMonth("9999-12"), months: 2 });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "invalid-horizon" } });
  });

  it("reports balance overflow instead of returning rounded money", () => {
    // Arrange
    const data = input({
      currentBalance: money(Number.MAX_SAFE_INTEGER),
      items: [item("income", "income", 1)],
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "amount-overflow" } });
  });

  it("keeps resolver diagnostics visible to the caller", () => {
    // Arrange
    const data = input({
      months: 2,
      items: [
        {
          ...item("bad", "income", 10),
          schedule: { kind: "recurring", intervalMonths: 0, anchor: START },
        },
      ],
      overrides: [
        { id: "bad", itemId: "bad", itemType: "income", month: START, amount: money(-1) },
      ],
    });

    // Act
    const result = forecast(data);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      invalidItems: data.items,
      rejectedOverrides: [{ errors: ["invalid-amount"] }],
      forecast: [{ income: 0 }, { income: 0 }],
    });
  });
});
