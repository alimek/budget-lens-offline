import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type MinorUnits, sumMinorUnits, toMinorUnits } from "./index";

// Amounts up to 10^12 minor units, in lists of up to 100 items: every partial sum stays a safe integer.
const amount = fc.integer({ min: -1e12, max: 1e12 }).map(toMinorUnits);
const amountList = fc.array(amount, { maxLength: 100 });

const exactSum = (amounts: readonly MinorUnits[]): bigint =>
  amounts.reduce((total, value) => total + BigInt(value), 0n);

describe("sumMinorUnits (properties)", () => {
  it("equals the exact integer sum, without rounding errors", () => {
    // Arrange
    const property = fc.property(amountList, (amounts) => {
      // Act
      const total = sumMinorUnits(amounts);

      // Assert
      expect(BigInt(total)).toBe(exactSum(amounts));
    });

    fc.assert(property);
  });

  it("does not depend on the order of the amounts", () => {
    // Arrange
    const property = fc.property(amountList, (amounts) => {
      // Act
      const forward = sumMinorUnits(amounts);
      const backward = sumMinorUnits([...amounts].reverse());

      // Assert
      expect(backward).toBe(forward);
    });

    fc.assert(property);
  });
});

describe("toMinorUnits (properties)", () => {
  it("rejects every amount that is not a whole number of minor units", () => {
    // Arrange
    const fraction = fc
      .double({ noNaN: true, noDefaultInfinity: true })
      .filter((value) => !Number.isInteger(value));
    const property = fc.property(fraction, (value) => {
      // Act + Assert
      expect(() => toMinorUnits(value)).toThrow(RangeError);
    });

    fc.assert(property);
  });
});
