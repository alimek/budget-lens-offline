import { describe, expect, it } from "vitest";
import type { Settings } from "./index";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  MAX_FORECAST_HORIZON_MONTHS,
  toMinorUnits,
  updateSettings,
} from "./index";

/** Changes as they may come from the UI or storage: typed fields are not trusted at runtime (#126). */
const untrusted = (changes: Record<string, unknown>): Partial<Settings> =>
  changes as Partial<Settings>;

describe("updateSettings", () => {
  it("applies valid changes and leaves the current settings untouched", () => {
    // Arrange
    const current = { ...DEFAULT_SETTINGS };

    // Act
    const result = updateSettings(current, {
      language: "en",
      trackedCurrencies: ["EUR"],
      lowBalanceThreshold: toMinorUnits(0),
      rateMaxAgeHours: 48,
    });

    // Assert
    expect(result).toEqual({
      ok: true,
      settings: {
        ...DEFAULT_SETTINGS,
        language: "en",
        trackedCurrencies: ["EUR"],
        lowBalanceThreshold: 0,
        rateMaxAgeHours: 48,
      },
    });
    expect(current).toEqual(DEFAULT_SETTINGS);
  });

  it("rejects invalid values and reports every invalid field at once", () => {
    // Arrange
    const changes = untrusted({
      baseCurrency: "pln",
      trackedCurrencies: ["USD", "USD"],
      largeExpenseThreshold: toMinorUnits(-1),
      forecastHorizonMonths: MAX_FORECAST_HORIZON_MONTHS + 1,
    });

    // Act
    const result = updateSettings(DEFAULT_SETTINGS, changes);

    // Assert
    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "baseCurrency", code: "invalid-currency" },
        { field: "trackedCurrencies", code: "duplicate-currency" },
        { field: "largeExpenseThreshold", code: "negative-threshold" },
        { field: "forecastHorizonMonths", code: "invalid-forecast-horizon" },
      ],
    });
  });

  it("rejects tracking the base currency, which has no exchange rate against itself", () => {
    // Arrange
    const changes = { trackedCurrencies: ["PLN", "USD"] as const };

    // Act
    const result = updateSettings(DEFAULT_SETTINGS, changes);

    // Assert
    expect(result).toEqual({
      ok: false,
      errors: [{ field: "trackedCurrencies", code: "base-currency-tracked" }],
    });
  });

  it("rejects well-formed codes outside the supported currencies, which cannot be formatted", () => {
    // Arrange
    const changes = untrusted({ baseCurrency: "BGN", trackedCurrencies: ["USD", "XAU"] });

    // Act
    const result = updateSettings(DEFAULT_SETTINGS, changes);

    // Assert
    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "baseCurrency", code: "unsupported-currency" },
        { field: "trackedCurrencies", code: "unsupported-currency" },
      ],
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
  it.each([0, -1, 1.5, "24", null])(
    "rejects an invalid rate freshness threshold and defaults stored data: %s",
    (rateMaxAgeHours) => {
      // Arrange
      const changes = untrusted({ rateMaxAgeHours });

      // Act
      const updated = updateSettings(DEFAULT_SETTINGS, changes);
      const loaded = loadSettings(changes);

      // Assert
      expect(updated).toEqual({
        ok: false,
        errors: [{ field: "rateMaxAgeHours", code: "invalid-rate-max-age" }],
      });
      expect(loaded.rateMaxAgeHours).toBe(24);
    },
  );

  it.each([
    { trackedCurrencies: ["USD", "EUR"], expected: ["EUR"] },
    { trackedCurrencies: ["USD"], expected: [] },
    { trackedCurrencies: ["USD", "BGN"], expected: ["EUR", "GBP"] },
    { trackedCurrencies: ["USD", "EUR", "EUR"], expected: ["EUR", "GBP"] },
    { trackedCurrencies: Array(2), expected: ["EUR", "GBP"] },
  ])(
    "removes the stored base from tracked, or falls back for invalid lists: $trackedCurrencies",
    ({ trackedCurrencies, expected }) => {
      // Arrange
      const stored = { baseCurrency: "USD", trackedCurrencies };

      // Act
      const settings = loadSettings(stored);

      // Assert
      expect(settings.trackedCurrencies).toEqual(expected);
      expect(updateSettings(settings, {}).ok).toBe(true);
    },
  );

  it("removes the default base from tracked when the stored base is invalid", () => {
    // Arrange: relies on baseCurrency being resolved before trackedCurrencies.
    const stored = { baseCurrency: "BGN", trackedCurrencies: ["PLN", "EUR"] };

    // Act
    const settings = loadSettings(stored);

    // Assert
    expect(settings.baseCurrency).toBe(DEFAULT_SETTINGS.baseCurrency);
    expect(settings.trackedCurrencies).toEqual(["EUR"]);
  });

  it("keeps valid stored fields, defaults invalid fields and drops unknown keys", () => {
    // Arrange
    const stored = JSON.parse(
      '{ "language": "en", "baseCurrency": "BGN", "forecastHorizonMonths": 0, "unknown": true }',
    );

    // Act
    const settings = loadSettings(stored);

    // Assert
    expect(settings).toEqual({ ...DEFAULT_SETTINGS, language: "en" });
    expect(Object.isFrozen(settings)).toBe(true);
    expect(Object.isFrozen(settings.trackedCurrencies)).toBe(true);
  });

  it("removes the loaded base currency from the fallback tracked list", () => {
    // Arrange
    const stored = { baseCurrency: "USD" };

    // Act
    const settings = loadSettings(stored);

    // Assert
    expect(settings).toEqual({
      ...DEFAULT_SETTINGS,
      baseCurrency: "USD",
      trackedCurrencies: ["EUR", "GBP"],
    });
    expect(updateSettings(settings, {}).ok).toBe(true);
  });
});
