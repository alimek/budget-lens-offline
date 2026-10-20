import { formatMoney, toMinorUnits } from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import { formatAmount } from "./amount";

/** Intl may use U+00A0 or U+202F between groups; the spec examples use plain spaces. */
function plainSpaces(text: string): string {
  return text.replace(/[\u00a0\u202f]/g, " ");
}

describe("formatAmount", () => {
  it.each([
    ["pl", "12 345,67 zł"],
    ["en", "PLN 12,345.67"],
  ] as const)("formats 1234567 grosze in %s as %s", (lang, expected) => {
    // Arrange
    const amount = toMinorUnits(1_234_567);

    // Act
    const { text } = formatAmount(amount, { lang, currency: "PLN" });

    // Assert
    expect(plainSpaces(text)).toBe(expected);
  });

  it("prefixes negative amounts with a real minus sign and the expense tone", () => {
    // Arrange
    const amount = toMinorUnits(-1_234_567);

    // Act
    const result = formatAmount(amount, { lang: "pl", currency: "PLN" });

    // Assert
    expect(result).toEqual({
      text: `\u2212${formatMoney(toMinorUnits(1_234_567), { lang: "pl", currency: "PLN" })}`,
      tone: "expense",
    });
  });

  it("adds a plus sign to positive amounts only when asked", () => {
    // Arrange
    const amount = toMinorUnits(5_000);
    const body = formatMoney(amount, { lang: "en", currency: "PLN" });

    // Act
    const auto = formatAmount(amount, { lang: "en", currency: "PLN" });
    const always = formatAmount(amount, { lang: "en", currency: "PLN", sign: "always" });

    // Assert
    expect([auto, always]).toEqual([
      { text: body, tone: "income" },
      { text: `+${body}`, tone: "income" },
    ]);
  });

  it("formats zero without a sign and with the neutral tone", () => {
    // Arrange
    const amount = toMinorUnits(-0);

    // Act
    const result = formatAmount(amount, { lang: "en", currency: "PLN", sign: "always" });

    // Assert
    expect(result).toEqual({
      text: formatMoney(toMinorUnits(0), { lang: "en", currency: "PLN" }),
      tone: "neutral",
    });
  });

  it("uses the currency's own fraction digits", () => {
    // Arrange
    const amount = toMinorUnits(-123_450);

    // Act
    const { text } = formatAmount(amount, { lang: "en", currency: "JPY" });

    // Assert
    expect(text).toBe(
      `\u2212${formatMoney(toMinorUnits(123_450), { lang: "en", currency: "JPY" })}`,
    );
  });
});
