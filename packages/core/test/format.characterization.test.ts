/**
 * Characterization tests for legacy money formatting and parsing defects that affect amounts
 * (mock-data.ts, update-balance-sheet.tsx, add-saving-dialog.tsx).
 */
import { describe, expect, it } from "vitest";
import { formatMoney, toMinorUnits } from "../src/index";
import {
  formatCurrency,
  formatCurrencyCompact,
  parseBalanceInput,
  valueInPlnFromCurrency,
} from "./legacy/format";

describe("formatCurrency", () => {
  it("shows a minus sign on amounts that round to 0 zł", () => {
    // LEGACY: -0.4 → "-0 zł" – fixed in #2: formatMoney shows "0 zł" (src/money-format.test.ts).
    // Arrange
    const amount = -0.4;

    // Act
    const formatted = formatCurrency(amount);

    // Assert
    expect(formatted).not.toBe(formatCurrency(0));
  });
});

describe("formatMoney with the legacy options", () => {
  it("matches legacy whole-unit formatting away from rounding halves", () => {
    // Arrange
    const cases = [
      { minor: 123449, legacy: 1234.49 },
      { minor: 123451, legacy: 1234.51 },
      { minor: -123451, legacy: -1234.51 },
      { minor: 0, legacy: 0 },
      { minor: 1234567800, legacy: 12345678 },
    ];
    const legacyOptions = { lang: "pl", currency: "PLN", fractionDigits: 0 } as const;

    // Act
    const formatted = cases.map(({ minor }) => formatMoney(toMinorUnits(minor), legacyOptions));

    // Assert
    expect(formatted).toEqual(cases.map(({ legacy }) => formatCurrency(legacy)));
  });
});

describe("formatCurrencyCompact", () => {
  it("compacts positive amounts but not negative ones", () => {
    // LEGACY: -5000 → "-5000"; #131 removes compact formatting from core entirely.
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
    // LEGACY: "1234,56" → 123456 – fixed in #2: parseMoney takes a decimal comma (src/money-parse.test.ts).
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
    // LEGACY: parseFloat("1,5") === 1 – #2 part done (parseMoney, multiplyByRate); savings conversion in #8.
    // Arrange
    const amountInCurrency = "1,5";
    const rate = 4;

    // Act
    const valueInPln = valueInPlnFromCurrency(amountInCurrency, rate);

    // Assert
    expect(valueInPln).toBe("4.00");
  });
});
