// The plain number an amount field shows (#61): grouping and fraction digits of the language and the currency's
// exponent, with no currency symbol anywhere.
import { toMinorUnits } from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import { formatAmountNumber } from "./amount";

describe("formatAmountNumber", () => {
  it.each([
    ["pl", 123456, "PLN", "1234,56"],
    ["en", 123456, "PLN", "1,234.56"],
    ["pl", 12000, "JPY", "12000"],
    ["en", 12000, "JPY", "12,000"],
    ["pl", 50, "PLN", "0,50"],
    ["en", 0, "PLN", "0.00"],
    ["pl", -1250, "PLN", "-12,50"],
  ] as const)("shows %v minor units in %s as %s", (lang, minor, currency, expected) => {
    // Arrange
    const amount = toMinorUnits(minor);

    // Act
    const text = formatAmountNumber(amount, { lang, currency });

    // Assert: the grouping is a no-break space whose exact code point is the ICU version's choice (#61 accepts
    // space, NBSP and narrow NBSP back when parsing), so it is compared away.
    expect(text.replace(/[\s\u00a0\u202f]/g, "")).toBe(expected);
    expect(text).not.toContain("zł");
    expect(text).not.toContain("PLN");
  });
});
