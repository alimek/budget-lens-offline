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
});
