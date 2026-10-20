import { describe, expect, it } from "vitest";
import { parseMoney, sumMinorUnits } from "./index";

const NBSP = "\u00a0";

const parsedValue = (input: string): number | undefined => {
  const result = parseMoney(input);
  return result.ok ? result.value : undefined;
};

describe("parseMoney", () => {
  it("sums 0,1 zł and 0.2 zł to exactly 30 grosze", () => {
    // Arrange
    const inputs = ["0,1", "0.2"];

    // Act
    const parsed = inputs
      .map((input) => parseMoney(input))
      .flatMap((result) => (result.ok ? [result.value] : []));
    const total = sumMinorUnits(parsed);

    // Assert
    expect(total).toBe(30);
  });

  it("parses a decimal comma or a decimal dot with thousands grouping", () => {
    // Arrange
    const inputs = ["1 234,56", `1${NBSP}234,56`, "1234.5", "1.234,56", "1,234.56", "1.234.567"];

    // Act
    const values = inputs.map(parsedValue);

    // Assert
    expect(values).toEqual([123456, 123456, 123450, 123456, 123456, 123456700]);
  });

  it("parses negative amounts", () => {
    // Arrange
    const inputs = ["-12", "\u22120,5"];

    // Act
    const values = inputs.map(parsedValue);

    // Assert
    expect(values).toEqual([-1200, -50]);
  });

  it("parses large amounts up to the safe integer limit and rejects larger ones", () => {
    // Arrange
    const largest = "90 071 992 547 409,91";
    const tooLarge = "90 071 992 547 409,92";

    // Act
    const parsedLargest = parseMoney(largest);
    const parsedTooLarge = parseMoney(tooLarge);

    // Assert
    expect(parsedLargest).toEqual({ ok: true, value: Number.MAX_SAFE_INTEGER });
    expect(parsedTooLarge).toEqual({ ok: false, error: "out-of-range" });
  });

  it("rejects invalid input with an error code", () => {
    // Arrange
    const inputs = ["  ", "1,234", "1 234,56 zł", "12,", "1 23", "1.234,5.6", "abc", "1\t234"];

    // Act
    const errors = inputs.map((input) => {
      const result = parseMoney(input);
      return result.ok ? undefined : result.error;
    });

    // Assert
    expect(errors).toEqual([
      "empty",
      "too-many-fraction-digits",
      "invalid-format",
      "invalid-format",
      "invalid-format",
      "invalid-format",
      "invalid-format",
      "invalid-format",
    ]);
  });

  it("uses the currency's minor-unit exponent: whole yen for JPY", () => {
    // Arrange
    const options = { currency: "JPY" } as const;

    // Act
    const wholeYen = parseMoney("1 234", options);
    const fraction = parseMoney("12,5", options);

    // Assert
    expect(wholeYen).toEqual({ ok: true, value: 1234 });
    expect(fraction).toEqual({ ok: false, error: "too-many-fraction-digits" });
  });

  it("reads a single comma or dot followed by 3 digits as thousands in currencies without minor digits (#164)", () => {
    // Arrange
    const inputs: readonly (readonly [string, "JPY" | "ISK" | "KRW" | "CLP"])[] = [
      ["1,000", "JPY"],
      ["1.000", "JPY"],
      ["123,450", "ISK"],
      ["999.999", "KRW"],
      ["-123,450", "CLP"],
      ["\u22121,000", "JPY"],
      ["1,000,000", "JPY"],
      [`1${NBSP}000`, "JPY"],
    ];

    // Act
    const results = inputs.map(([input, currency]) => parseMoney(input, { currency }));

    // Assert
    expect(results).toEqual(
      [1000, 1000, 123450, 999999, -123450, -1000, 1000000, 1000].map((value) => ({
        ok: true,
        value,
      })),
    );
  });

  it("still rejects fractions and malformed grouping in currencies without minor digits (#164)", () => {
    // Arrange
    const inputs = [
      "1,00",
      "1,0000",
      "12,5",
      "1234,567",
      "1 000,000",
      "1.000,000",
      "1,000.",
      "JP¥1,000",
    ];

    // Act
    const errors = inputs.map((input) => {
      const result = parseMoney(input, { currency: "JPY" });
      return result.ok ? undefined : result.error;
    });

    // Assert
    expect(errors).toEqual([
      "too-many-fraction-digits",
      "too-many-fraction-digits",
      "too-many-fraction-digits",
      "invalid-format",
      "invalid-format",
      "invalid-format",
      "invalid-format",
      "invalid-format",
    ]);
  });

  it("keeps a single comma or dot as the decimal separator in currencies with minor digits (#2)", () => {
    // Arrange
    const inputs = ["1,000", "1.000", "-1,234"];

    // Act
    const pln = inputs.map((input) => parseMoney(input, { currency: "PLN" }));
    const plnGroupedWithFraction = parseMoney("1,000.50", { currency: "PLN" });

    // Assert
    expect(pln).toEqual(inputs.map(() => ({ ok: false, error: "too-many-fraction-digits" })));
    expect(plnGroupedWithFraction).toEqual({ ok: true, value: 100050 });
  });
});
