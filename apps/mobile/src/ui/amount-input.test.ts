import { describe, expect, it } from "vitest";
import { validateAmountInput } from "./amount-input";

describe("validateAmountInput", () => {
  it.each([
    ["12,5", 1250],
    ["1 234,56", 123_456],
    ["-89.99", -8999],
  ])("accepts %s as %i grosze", (text, expected) => {
    // Act
    const result = validateAmountInput(text, "PLN");

    // Assert
    expect(result).toEqual({ ok: true, value: expected });
  });

  it.each([
    ["", "amountInput.empty"],
    ["12 zł", "amountInput.invalidFormat"],
    ["12,345", "amountInput.tooManyFractionDigits"],
  ])("rejects %j with %s", (text, errorKey) => {
    // Act
    const result = validateAmountInput(text, "PLN");

    // Assert
    expect(result).toEqual({ ok: false, errorKey });
  });

  it("names the exponent of the currency in the fraction error", () => {
    // Assert: JPY has no minor digits, so the error says so instead of counting decimal places (#61).
    expect(validateAmountInput("12,5", "JPY")).toEqual({
      ok: false,
      errorKey: "amountInput.noFractionDigits",
    });
    // A comma in front of three digits groups thousands in such a currency (#164).
    expect(validateAmountInput("1,000", "JPY")).toEqual({ ok: true, value: 1000 });
  });
});
