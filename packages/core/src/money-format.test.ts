/**
 * The expected strings are written with their exact characters: `formatMoney` and `formatMoneyCompact` use CLDR
 * data from `money-locale.ts`, not the runtime's `Intl`, so the output is the same in Node.js and on Hermes.
 */
import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyCompact, toMinorUnits } from "./index";

const NBSP = "\u00a0";

describe("formatMoney", () => {
  it("formats pl PLN amounts with grosze, negative and large amounts", () => {
    // Arrange
    const options = { lang: "pl", currency: "PLN" } as const;
    const amounts = [123456, -123450, 1234567890].map(toMinorUnits);

    // Act
    const formatted = amounts.map((amount) => formatMoney(amount, options));

    // Assert
    expect(formatted).toEqual([
      `1234,56${NBSP}zł`,
      `-1234,50${NBSP}zł`,
      `12${NBSP}345${NBSP}678,90${NBSP}zł`,
    ]);
  });

  it("formats the largest safe amount exactly, without losing the last grosz", () => {
    // Arrange
    const largest = toMinorUnits(Number.MAX_SAFE_INTEGER);

    // Act
    const formatted = formatMoney(largest, { lang: "pl", currency: "PLN" });

    // Assert
    expect(formatted).toBe(`90${NBSP}071${NBSP}992${NBSP}547${NBSP}409,91${NBSP}zł`);
  });

  it("uses the language's symbol, its position and the currency's exponent, or the ISO code", () => {
    // Arrange
    const amount = toMinorUnits(-123450);

    // Act
    const formatted = [
      formatMoney(amount, { lang: "en", currency: "GBP" }),
      formatMoney(amount, { lang: "en", currency: "USD" }),
      formatMoney(amount, { lang: "en", currency: "JPY" }),
      formatMoney(amount, { lang: "en", currency: "PLN" }),
      formatMoney(amount, { lang: "pl", currency: "EUR" }),
      formatMoney(amount, { lang: "pl", currency: "USD" }),
    ];

    // Assert
    expect(formatted).toEqual([
      "-£1,234.50",
      "-US$1,234.50",
      "-JP¥123,450",
      `-PLN${NBSP}1,234.50`,
      `-1234,50${NBSP}€`,
      `-1234,50${NBSP}USD`,
    ]);
  });

  it("rounds to whole units half away from zero and shows no minus sign on 0", () => {
    // Arrange
    const options = { lang: "pl", currency: "PLN", fractionDigits: 0 } as const;
    const amounts = [123450, -123450, -49].map(toMinorUnits);

    // Act
    const formatted = amounts.map((amount) => formatMoney(amount, options));

    // Assert
    expect(formatted).toEqual([`1235${NBSP}zł`, `-1235${NBSP}zł`, `0${NBSP}zł`]);
  });
});

describe("formatMoneyCompact", () => {
  it("compacts positive and negative amounts in the language's notation", () => {
    // Arrange
    const amounts = [500000, -500000, 150000000, 99999999].map(toMinorUnits);

    // Act
    const polish = amounts.map((amount) =>
      formatMoneyCompact(amount, { lang: "pl", currency: "PLN" }),
    );
    const english = amounts.map((amount) =>
      formatMoneyCompact(amount, { lang: "en", currency: "PLN" }),
    );

    // Assert
    expect(polish).toEqual([`5${NBSP}tys.`, `-5${NBSP}tys.`, `1,5${NBSP}mln`, `1${NBSP}mln`]);
    expect(english).toEqual(["5K", "-5K", "1.5M", "1M"]);
  });
});
