import { describe, expect, it } from "vitest";
import { type CurrencyCode, convertViaPln, MoneyOverflowError, toMinorUnits } from "./index";

const rates: Partial<Record<CurrencyCode, string>> = {
  EUR: "4.3661",
  USD: "3.8827",
  JPY: "0.024574",
};

describe("convertViaPln", () => {
  it.each([
    [100000, "PLN", "EUR", 22904],
    [10000, "EUR", "PLN", 43661],
    [10000, "USD", "EUR", 8893],
    [-10000, "USD", "EUR", -8893],
    [10000, "JPY", "PLN", 24574],
    [10000, "PLN", "JPY", 4069],
    [1, "JPY", "EUR", 1],
  ] as const)("converts %s %s to %s with one rounding", (amount, from, to, expected) => {
    // Arrange
    const source = toMinorUnits(amount);

    // Act
    const result = convertViaPln(source, from, to, (currency) => rates[currency]);

    // Assert
    expect(result).toBe(expected);
  });

  it.each([
    [1, 1],
    [-1, -1],
    [3, 2],
    [-3, -2],
  ] as const)("rounds ties away from zero: %s", (amount, expected) => {
    // Arrange
    const source = toMinorUnits(amount);

    // Act
    const result = convertViaPln(source, "EUR", "PLN", () => "0.5");

    // Assert
    expect(result).toBe(expected);
  });

  it("keeps identity exact without consulting rates", () => {
    // Arrange
    const source = toMinorUnits(Number.MAX_SAFE_INTEGER);

    // Act
    const result = convertViaPln(source, "JPY", "JPY", () => {
      throw new Error("Unexpected rate lookup");
    });

    // Assert
    expect(result).toBe(source);
  });

  it("rejects conversion overflow", () => {
    // Arrange
    const source = toMinorUnits(Number.MAX_SAFE_INTEGER);

    // Act
    const action = () => convertViaPln(source, "EUR", "PLN", () => "2");

    // Assert
    expect(action).toThrow(MoneyOverflowError);
  });
});
