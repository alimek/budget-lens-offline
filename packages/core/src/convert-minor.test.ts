import { describe, expect, it } from "vitest";
import { type CurrencyCode, convertMinor, toMinorUnits } from "./index";

const rates: Partial<Record<CurrencyCode, string>> = {
  EUR: "4.3661",
  USD: "3.8827",
  JPY: "0.024574",
};

describe("convertMinor", () => {
  it.each([
    [100000, "PLN", "EUR", 22904],
    [10000, "EUR", "PLN", 43661],
    [10000, "USD", "EUR", 8893],
    [-10000, "USD", "EUR", -8893],
    [10000, "JPY", "PLN", 24574],
    [10000, "PLN", "JPY", 4069],
    [1, "JPY", "EUR", 1],
  ] as const)("converts %s %s to %s with one rounding", (amount, from, to, expected) => {
    const source = toMinorUnits(amount);

    const result = convertMinor(source, from, to, (currency) => rates[currency]);

    expect(result).toBe(expected);
  });

  it.each([
    [1, 1],
    [-1, -1],
    [3, 2],
    [-3, -2],
  ] as const)("rounds ties away from zero: %s", (amount, expected) => {
    const source = toMinorUnits(amount);

    const result = convertMinor(source, "EUR", "PLN", () => "0.5");

    expect(result).toBe(expected);
  });

  it("keeps identity exact without consulting rates", () => {
    const source = toMinorUnits(Number.MAX_SAFE_INTEGER);

    const result = convertMinor(source, "JPY", "JPY", () => {
      throw new Error("Unexpected rate lookup");
    });

    expect(result).toBe(source);
  });

  it("rejects conversion overflow", () => {
    const source = toMinorUnits(Number.MAX_SAFE_INTEGER);

    const action = () => convertMinor(source, "EUR", "PLN", () => "2");

    expect(action).toThrow("amount-overflow");
  });
});
