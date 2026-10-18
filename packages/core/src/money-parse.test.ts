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
    const parsed = inputs.map(parseMoney).flatMap((result) => (result.ok ? [result.value] : []));
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
    const inputs = ["  ", "1,234", "1 234,56 zł", "12,", "1 23", "1.234,5.6", "abc"];

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
    ]);
  });
});
