import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, toMinorUnits, updateSettings } from "./index";

describe("DEFAULT_SETTINGS", () => {
  it("keeps the legacy defaults: 5000 PLN low balance, 10000 PLN large expense, USD/EUR/GBP, 13 months", () => {
    // Arrange
    const legacy = {
      defaultCurrency: "PLN",
      trackedCurrencies: ["USD", "EUR", "GBP"],
      lowBalanceThreshold: 500_000,
      largeExpenseThreshold: 1_000_000,
      forecastHorizonMonths: 13,
    };

    // Act
    const defaults = DEFAULT_SETTINGS;

    // Assert
    expect(defaults).toEqual({ ...legacy, language: "system" });
  });
});

describe("updateSettings", () => {
  it("applies valid changes and leaves the current settings untouched", () => {
    // Arrange
    const current = DEFAULT_SETTINGS;

    // Act
    const result = updateSettings(current, {
      language: "en",
      trackedCurrencies: ["EUR"],
      lowBalanceThreshold: toMinorUnits(0),
    });

    // Assert
    expect(result).toEqual({
      ok: true,
      settings: {
        ...DEFAULT_SETTINGS,
        language: "en",
        trackedCurrencies: ["EUR"],
        lowBalanceThreshold: 0,
      },
    });
    expect(current.language).toBe("system");
  });

  it("rejects invalid values and reports every invalid field at once", () => {
    // Arrange
    const changes = {
      defaultCurrency: "pln",
      trackedCurrencies: ["USD", "USD"],
      largeExpenseThreshold: toMinorUnits(-1),
      forecastHorizonMonths: 0,
    };

    // Act
    const result = updateSettings(DEFAULT_SETTINGS, changes);

    // Assert
    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "defaultCurrency", code: "invalid-currency" },
        { field: "trackedCurrencies", code: "duplicate-currency" },
        { field: "largeExpenseThreshold", code: "negative-threshold" },
        { field: "forecastHorizonMonths", code: "invalid-forecast-horizon" },
      ],
    });
  });

  it("rejects a stored language the app does not ship in", () => {
    // Arrange
    const stored = JSON.parse('{ "language": "de" }');

    // Act
    const result = updateSettings(DEFAULT_SETTINGS, stored);

    // Assert
    expect(result).toEqual({
      ok: false,
      errors: [{ field: "language", code: "invalid-language" }],
    });
  });
});
