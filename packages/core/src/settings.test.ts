import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  MAX_FORECAST_HORIZON_MONTHS,
  toMinorUnits,
  updateSettings,
} from "./index";

describe("updateSettings", () => {
  it("applies valid changes and leaves the current settings untouched", () => {
    // Arrange
    const current = { ...DEFAULT_SETTINGS };

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
    expect(current).toEqual(DEFAULT_SETTINGS);
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

describe("loadSettings", () => {
  it("keeps valid stored fields, defaults invalid fields and drops unknown keys", () => {
    // Arrange
    const stored = JSON.parse('{ "language": "en", "forecastHorizonMonths": 0, "unknown": true }');

    // Act
    const settings = loadSettings(stored);

    // Assert
    expect(settings).toEqual({ ...DEFAULT_SETTINGS, language: "en" });
    expect(Object.isFrozen(settings)).toBe(true);
    expect(Object.isFrozen(settings.trackedCurrencies)).toBe(true);
  });

  it("removes the loaded base currency from the fallback tracked list", () => {
    // Arrange
    const stored = { defaultCurrency: "USD" };

    // Act
    const settings = loadSettings(stored);

    // Assert
    expect(settings).toEqual({
      ...DEFAULT_SETTINGS,
      defaultCurrency: "USD",
      trackedCurrencies: ["EUR", "GBP"],
    });
    expect(updateSettings(settings, {}).ok).toBe(true);
  });
});
