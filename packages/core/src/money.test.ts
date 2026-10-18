import { describe, expect, it } from "vitest";
import { isMinorUnits, sumMinorUnits } from "./index";

describe("isMinorUnits", () => {
  it("accepts integers", () => {
    expect(isMinorUnits(0)).toBe(true);
    expect(isMinorUnits(1999)).toBe(true);
    expect(isMinorUnits(-250)).toBe(true);
  });

  it("rejects fractions and non-finite values", () => {
    expect(isMinorUnits(19.99)).toBe(false);
    expect(isMinorUnits(Number.NaN)).toBe(false);
    expect(isMinorUnits(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("sumMinorUnits", () => {
  it("returns 0 for an empty list", () => {
    expect(sumMinorUnits([])).toBe(0);
  });

  it("sums amounts without rounding errors", () => {
    // 0.10 + 0.20 = 0.30 (with floats: 0.1 + 0.2 !== 0.3)
    expect(sumMinorUnits([10, 20])).toBe(30);
    expect(sumMinorUnits([1999, -500, 1])).toBe(1500);
  });

  it("throws for an amount that is not an integer number of minor units", () => {
    expect(() => sumMinorUnits([100, 0.5])).toThrow(RangeError);
  });

  it("throws when the sum exceeds the safe integer range", () => {
    expect(() => sumMinorUnits([Number.MAX_SAFE_INTEGER, 1])).toThrow(RangeError);
  });
});
