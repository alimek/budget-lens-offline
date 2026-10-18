/**
 * Characterization tests for legacy money formatting and parsing defects that affect amounts
 * (mock-data.ts, update-balance-sheet.tsx, add-saving-dialog.tsx).
 */
import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatCurrencyCompact,
  parseBalanceInput,
  valueInPlnFromCurrency,
} from "./legacy/format";

const NBSP = "\u00a0";

describe("formatCurrency", () => {
  it("hides grosze by rounding to whole złoty", () => {
    // LEGACY: 0 fraction digits – changed by #2 (2 fraction digits supported).
    // Arrange
    const amounts = [1234.49, 1234.5, -1234.5];

    // Act
    const formatted = amounts.map(formatCurrency);

    // Assert
    expect(formatted).toEqual([`1234${NBSP}zł`, `1235${NBSP}zł`, `-1235${NBSP}zł`]);
  });
});

describe("formatCurrencyCompact", () => {
  it("compacts positive amounts but not negative ones", () => {
    // LEGACY: -5000 → "-5000" instead of "-5k" – changed by #2.
    // Arrange
    const amounts = [5000, -5000];

    // Act
    const formatted = amounts.map(formatCurrencyCompact);

    // Assert
    expect(formatted).toEqual(["5k", "-5000"]);
  });
});

describe("parseBalanceInput", () => {
  it("parses a dot decimal but turns a Polish decimal comma into a 100x larger amount", () => {
    // LEGACY: "1234,56" → 123456 – changed by #2.
    // Arrange
    const dotInput = "1234.56";
    const commaInput = "1 234,56 zł";

    // Act
    const fromDot = parseBalanceInput(dotInput);
    const fromComma = parseBalanceInput(commaInput);

    // Assert
    expect(fromDot).toBe(1234.56);
    expect(fromComma).toBe(123456);
  });
});

describe("valueInPlnFromCurrency", () => {
  it("truncates a comma-decimal amount at the comma", () => {
    // LEGACY: parseFloat("1,5") === 1 – changed by #2 and #8.
    // Arrange
    const amountInCurrency = "1,5";
    const rate = 4;

    // Act
    const valueInPln = valueInPlnFromCurrency(amountInCurrency, rate);

    // Assert
    expect(valueInPln).toBe("4.00");
  });
});
