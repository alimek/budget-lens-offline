/**
 * The expected strings are Node.js ICU (CLDR) output: symbol position, separators and compact suffixes may differ on
 * Hermes or after a CLDR update. Device output is checked in #38 and by e2e tests. Spaces are normalized because ICU
 * uses no-break spaces (U+00A0 or U+202F, depending on the CLDR version).
 */
import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyCompact, toMinorUnits } from "./index";

const withPlainSpaces = (text: string): string => text.replace(/[\u00a0\u202f]/g, " ");

describe("formatMoney", () => {
  it("formats pl-PL amounts with grosze, negative and large amounts", () => {
    // Arrange
    const options = { locale: "pl-PL", currency: "PLN" };
    const amounts = [123456, -123450, 1234567890].map(toMinorUnits);

    // Act
    const formatted = amounts.map((amount) => withPlainSpaces(formatMoney(amount, options)));

    // Assert
    expect(formatted).toEqual(["1234,56 zł", "-1234,50 zł", "12 345 678,90 zł"]);
  });

  it("formats the largest safe amount exactly, without losing the last grosz", () => {
    // Arrange
    const largest = toMinorUnits(Number.MAX_SAFE_INTEGER);

    // Act
    const formatted = formatMoney(largest, { locale: "pl-PL", currency: "PLN" });

    // Assert
    expect(withPlainSpaces(formatted)).toBe("90 071 992 547 409,91 zł");
  });

  it("formats in the given locale and with 0 fraction digits when asked", () => {
    // Arrange
    const amount = toMinorUnits(123450);

    // Act
    const english = formatMoney(amount, { locale: "en", currency: "PLN" });
    const wholeZloty = formatMoney(amount, { locale: "pl-PL", currency: "PLN", fractionDigits: 0 });

    // Assert
    expect(withPlainSpaces(english)).toBe("PLN 1,234.50");
    expect(withPlainSpaces(wholeZloty)).toBe("1235 zł");
  });
});

describe("formatMoneyCompact", () => {
  it("compacts positive and negative amounts in the locale's notation", () => {
    // Arrange
    const amounts = [500000, -500000, 150000000].map(toMinorUnits);

    // Act
    const polish = amounts.map((amount) =>
      withPlainSpaces(formatMoneyCompact(amount, { locale: "pl-PL" })),
    );
    const english = amounts.map((amount) => formatMoneyCompact(amount, { locale: "en" }));

    // Assert
    expect(polish).toEqual(["5 tys.", "-5 tys.", "1,5 mln"]);
    expect(english).toEqual(["5K", "-5K", "1.5M"]);
  });
});
