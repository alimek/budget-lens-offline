import { type MinorUnits, toMinorUnits } from "./money";

/** UI languages the app ships in. */
export type Language = "pl" | "en";

/** The user's language choice; `"system"` follows the device language (resolved by the app's i18n layer). */
export type LanguagePreference = Language | "system";

/**
 * The single local settings model. Every calculation that needs a currency, a warning threshold or the forecast
 * horizon reads it from here, never from constants.
 *
 * Thresholds are amounts in minor units of `defaultCurrency`.
 */
export interface Settings {
  readonly language: LanguagePreference;
  /** ISO 4217 code of the currency all budget amounts are kept in. */
  readonly defaultCurrency: string;
  /** ISO 4217 codes of the currencies whose exchange rates are tracked (savings in other currencies). */
  readonly trackedCurrencies: readonly string[];
  /** Low-balance warning: a forecast balance below this amount. */
  readonly lowBalanceThreshold: MinorUnits;
  /** Large-outflow warning: a month whose net change is lower than minus this amount. */
  readonly largeExpenseThreshold: MinorUnits;
  /** Number of months the forecast projects, including the start month. */
  readonly forecastHorizonMonths: number;
}

/** Defaults for a new installation; values match the legacy app (see docs/domain/settings.md). */
export const DEFAULT_SETTINGS: Settings = Object.freeze({
  language: "system",
  defaultCurrency: "PLN",
  trackedCurrencies: Object.freeze(["USD", "EUR", "GBP"]),
  lowBalanceThreshold: toMinorUnits(500_000),
  largeExpenseThreshold: toMinorUnits(1_000_000),
  forecastHorizonMonths: 13,
});

export type SettingsErrorCode =
  | "invalid-language"
  | "invalid-currency"
  | "duplicate-currency"
  | "negative-threshold"
  | "invalid-forecast-horizon";

/** A validation problem with one field; the UI translates `code`, so no message is returned. */
export interface SettingsError {
  readonly field: keyof Settings;
  readonly code: SettingsErrorCode;
}

export type UpdateSettingsResult =
  | { readonly ok: true; readonly settings: Settings }
  | { readonly ok: false; readonly errors: readonly SettingsError[] };

const LANGUAGE_PREFERENCES: readonly string[] = ["system", "pl", "en"];
const CURRENCY_CODE = /^[A-Z]{3}$/;

function validate(settings: Settings): SettingsError[] {
  const errors: SettingsError[] = [];
  if (!LANGUAGE_PREFERENCES.includes(settings.language)) {
    errors.push({ field: "language", code: "invalid-language" });
  }
  if (!CURRENCY_CODE.test(settings.defaultCurrency)) {
    errors.push({ field: "defaultCurrency", code: "invalid-currency" });
  }
  if (!settings.trackedCurrencies.every((code) => CURRENCY_CODE.test(code))) {
    errors.push({ field: "trackedCurrencies", code: "invalid-currency" });
  }
  if (new Set(settings.trackedCurrencies).size !== settings.trackedCurrencies.length) {
    errors.push({ field: "trackedCurrencies", code: "duplicate-currency" });
  }
  for (const field of ["lowBalanceThreshold", "largeExpenseThreshold"] as const) {
    if (settings[field] < 0) {
      errors.push({ field, code: "negative-threshold" });
    }
  }
  if (!Number.isSafeInteger(settings.forecastHorizonMonths) || settings.forecastHorizonMonths < 1) {
    errors.push({ field: "forecastHorizonMonths", code: "invalid-forecast-horizon" });
  }
  return errors;
}

/**
 * Applies `changes` to `current` and validates the result. Returns every validation error at once and never
 * mutates `current`. Also used to load stored settings: `updateSettings(DEFAULT_SETTINGS, stored)`.
 */
export function updateSettings(
  current: Settings,
  changes: Partial<Settings>,
): UpdateSettingsResult {
  const next: Settings = { ...current, ...changes };
  const errors = validate(next);
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    settings: Object.freeze({
      ...next,
      trackedCurrencies: Object.freeze([...next.trackedCurrencies]),
    }),
  };
}
