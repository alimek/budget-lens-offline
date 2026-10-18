import { describe, expect, it } from "vitest";
import { formatMoney, toMinorUnits } from "./index";

describe("formatMoney", () => {
  it.each([
    { lang: "pl", currency: "PLN", minor: 123456, major: 1234.56, digits: 2 },
    { lang: "en", currency: "GBP", minor: -500000, major: -5000, digits: 2 },
    { lang: "en", currency: "JPY", minor: 123450, major: 123450, digits: 0 },
    { lang: "pl", currency: "HUF", minor: 123450, major: 1234.5, digits: 2 },
    { lang: "en", currency: "IDR", minor: 123450, major: 1234.5, digits: 2 },
  ] as const)("shows full $currency amounts in $lang with the currency's exponent", (testCase) => {
    // Arrange
    const { lang, currency, minor, major, digits } = testCase;
    const amount = toMinorUnits(minor);
    const native = new Intl.NumberFormat(lang === "pl" ? "pl-PL" : "en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

    // Act
    const formatted = formatMoney(amount, { lang, currency });

    // Assert
    expect(formatted).toBe(native.format(major));
  });

  it.each([
    { minor: 123449, whole: 1234 },
    { minor: 123450, whole: 1235 },
    { minor: -123450, whole: -1235 },
    { minor: -49, whole: 0 },
    { minor: -0, whole: 0 },
    { minor: 9007199254740949, whole: 90071992547409 },
    { minor: Number.MAX_SAFE_INTEGER, whole: 90071992547410 },
    { minor: Number.MIN_SAFE_INTEGER, whole: -90071992547410 },
  ])(
    "rounds $minor minor units to $whole whole units without negative zero",
    ({ minor, whole }) => {
      // Arrange
      const amount = toMinorUnits(minor);
      const options = { lang: "pl", currency: "PLN", fractionDigits: 0 } as const;
      const native = new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

      // Act
      const formatted = formatMoney(amount, options);

      // Assert
      expect(formatted).toBe(native.format(whole));
    },
  );

  it("normalizes negative zero with currency fraction digits", () => {
    // Arrange
    const negativeZero = -0 as ReturnType<typeof toMinorUnits>;
    const options = { lang: "pl", currency: "PLN" } as const;

    // Act
    const formatted = formatMoney(negativeZero, options);

    // Assert
    expect(formatted).toBe(formatMoney(toMinorUnits(0), options));
  });
});
