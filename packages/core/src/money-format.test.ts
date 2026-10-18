import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyCompact, toMinorUnits } from "./index";

const NBSP = "\u00a0";

describe("formatMoney", () => {
  it("formats pl-PL amounts with grosze, negative and large amounts", () => {
    // Arrange
    const options = { locale: "pl-PL", currency: "PLN" };
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

  it("formats in the given locale and with 0 fraction digits when asked", () => {
    // Arrange
    const amount = toMinorUnits(123450);

    // Act
    const english = formatMoney(amount, { locale: "en", currency: "PLN" });
    const wholeZloty = formatMoney(amount, { locale: "pl-PL", currency: "PLN", fractionDigits: 0 });

    // Assert
    expect(english).toBe(`PLN${NBSP}1,234.50`);
    expect(wholeZloty).toBe(`1235${NBSP}zł`);
  });
});

describe("formatMoneyCompact", () => {
  it("compacts positive and negative amounts in the locale's notation", () => {
    // Arrange
    const amounts = [500000, -500000, 150000000].map(toMinorUnits);

    // Act
    const polish = amounts.map((amount) => formatMoneyCompact(amount, { locale: "pl-PL" }));
    const english = amounts.map((amount) => formatMoneyCompact(amount, { locale: "en" }));

    // Assert
    expect(polish).toEqual([`5${NBSP}tys.`, `-5${NBSP}tys.`, `1,5${NBSP}mln`]);
    expect(english).toEqual(["5K", "-5K", "1.5M"]);
  });
});
