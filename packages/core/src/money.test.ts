import { describe, expect, it } from "vitest";
import { isMinorUnits, type MinorUnits, sumMinorUnits, toMinorUnits } from "./index";

const MAX = Number.MAX_SAFE_INTEGER;
const MIN = Number.MIN_SAFE_INTEGER;

/** Bypasses validation to simulate invalid values coming from untyped sources. */
const unchecked = (values: number[]): MinorUnits[] => values as MinorUnits[];

const amounts = (values: number[]): MinorUnits[] => values.map(toMinorUnits);

describe("isMinorUnits", () => {
  it("accepts integers", () => {
    expect(isMinorUnits(0)).toBe(true);
    expect(isMinorUnits(1999)).toBe(true);
    expect(isMinorUnits(-250)).toBe(true);
  });

  it("accepts the safe integer boundaries", () => {
    expect(isMinorUnits(MAX)).toBe(true);
    expect(isMinorUnits(MIN)).toBe(true);
  });

  it("rejects values just outside the safe integer range", () => {
    expect(isMinorUnits(MAX + 1)).toBe(false);
    expect(isMinorUnits(MIN - 1)).toBe(false);
  });

  it("accepts negative zero", () => {
    expect(isMinorUnits(-0)).toBe(true);
  });

  it("rejects fractions", () => {
    expect(isMinorUnits(19.99)).toBe(false);
    expect(isMinorUnits(0.5)).toBe(false);
    expect(isMinorUnits(-0.1)).toBe(false);
  });

  it("rejects non-finite values", () => {
    expect(isMinorUnits(Number.NaN)).toBe(false);
    expect(isMinorUnits(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isMinorUnits(Number.NEGATIVE_INFINITY)).toBe(false);
  });
});

describe("toMinorUnits", () => {
  it("returns the same value for safe integers", () => {
    expect(toMinorUnits(1999)).toBe(1999);
    expect(toMinorUnits(MAX)).toBe(MAX);
    expect(toMinorUnits(MIN)).toBe(MIN);
  });

  it("normalizes negative zero to zero", () => {
    expect(Object.is(toMinorUnits(-0), 0)).toBe(true);
  });

  it("throws for values that are not safe integers", () => {
    expect(() => toMinorUnits(0.5)).toThrow(RangeError);
    expect(() => toMinorUnits(MAX + 1)).toThrow(RangeError);
    expect(() => toMinorUnits(MIN - 1)).toThrow(RangeError);
    expect(() => toMinorUnits(Number.NaN)).toThrow(RangeError);
    expect(() => toMinorUnits(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("sumMinorUnits", () => {
  it("returns 0 for an empty list", () => {
    expect(sumMinorUnits([])).toBe(0);
  });

  it("sums amounts without rounding errors", () => {
    // 0.10 + 0.20 = 0.30 (with floats: 0.1 + 0.2 !== 0.3)
    expect(sumMinorUnits(amounts([10, 20]))).toBe(30);
    expect(sumMinorUnits(amounts([1999, -500, 1]))).toBe(1500);
  });

  it("sums up to the safe integer boundaries", () => {
    expect(sumMinorUnits(amounts([MAX - 1, 1]))).toBe(MAX);
    expect(sumMinorUnits(amounts([MIN + 1, -1]))).toBe(MIN);
  });

  it("throws for an amount that is not an integer number of minor units", () => {
    expect(() => sumMinorUnits(unchecked([100, 0.5]))).toThrow(RangeError);
  });

  it("throws for NaN and Infinity in the list", () => {
    expect(() => sumMinorUnits(unchecked([100, Number.NaN]))).toThrow(RangeError);
    expect(() => sumMinorUnits(unchecked([100, Number.POSITIVE_INFINITY]))).toThrow(RangeError);
    expect(() => sumMinorUnits(unchecked([100, Number.NEGATIVE_INFINITY]))).toThrow(RangeError);
  });

  it("throws on overflow", () => {
    expect(() => sumMinorUnits(amounts([MAX, 1]))).toThrow(RangeError);
  });

  it("throws on intermediate overflow even if the final sum would be in range", () => {
    // Float addition makes MAX + 2 - 2 silently wrong, so the range is checked after every step.
    expect(() => sumMinorUnits(amounts([MAX, 2, -2]))).toThrow(RangeError);
  });

  it("throws on underflow", () => {
    expect(() => sumMinorUnits(amounts([MIN, -1]))).toThrow(RangeError);
    expect(() => sumMinorUnits(amounts([MIN, -2, 2]))).toThrow(RangeError);
  });

  it("rejects plain numbers at compile time", () => {
    // @ts-expect-error plain numbers must go through toMinorUnits first
    expect(sumMinorUnits([10, 20])).toBe(30);
  });

  it("does not mutate the input", () => {
    const input = Object.freeze(amounts([10, 20, 30]));
    expect(sumMinorUnits(input)).toBe(60);
    expect(input).toEqual([10, 20, 30]);
  });
});
