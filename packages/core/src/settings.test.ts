import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  MAX_FORECAST_HORIZON_MONTHS,
  toMinorUnits,
  updateSettings,
} from "./index";

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
      forecastHorizonMonths: MAX_FORECAST_HORIZON_MONTHS + 1,
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

  it("rejects tracking the default currency, which has no exchange rate against itself", () => {
    // Arrange
    const changes = { trackedCurrencies: ["PLN", "USD"] };

    // Act
    const result = updateSettings(DEFAULT_SETTINGS, changes);

    // Assert
    expect(result).toEqual({
      ok: false,
      errors: [{ field: "trackedCurrencies", code: "default-currency-tracked" }],
    });
  });

  it("reports malformed stored settings as errors instead of throwing", () => {
    // Arrange
    const stored = JSON.parse(
      '{ "language": "de", "lowBalanceThreshold": 1.5, "trackedCurrencies": "USD" }',
    );

    // Act
    const result = updateSettings(DEFAULT_SETTINGS, stored);

    // Assert
    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "language", code: "invalid-language" },
        { field: "trackedCurrencies", code: "invalid-currency" },
        { field: "lowBalanceThreshold", code: "invalid-threshold" },
      ],
    });
  });

  it("drops stored keys that are not settings fields", () => {
    // Arrange
    const stored = JSON.parse('{ "language": "pl", "low_balance_threshold": 5000, "foo": 1 }');

    // Act
    const result = updateSettings(DEFAULT_SETTINGS, stored);

    // Assert
    expect(result).toEqual({ ok: true, settings: { ...DEFAULT_SETTINGS, language: "pl" } });
  });
});
