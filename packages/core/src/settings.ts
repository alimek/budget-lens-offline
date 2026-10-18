import { isMinorUnits, type MinorUnits, toMinorUnits } from "./money";

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
  /** Number of months the forecast projects, including the start month: 1 to {@link MAX_FORECAST_HORIZON_MONTHS}. */
  readonly forecastHorizonMonths: number;
}

/** Upper bound of `forecastHorizonMonths` (10 years), so a corrupted value cannot make the forecast hang. */
export const MAX_FORECAST_HORIZON_MONTHS = 120;

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
  | "default-currency-tracked"
  | "invalid-threshold"
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

/** Field values as they may come from storage: the static `Settings` types are not trusted at runtime. */
type UntrustedSettings = { readonly [Field in keyof Settings]: unknown };

const isCurrencyCode = (value: unknown): value is string =>
  typeof value === "string" && CURRENCY_CODE.test(value);

function validate(settings: UntrustedSettings): SettingsError[] {
  const errors: SettingsError[] = [];
  const { language, defaultCurrency, trackedCurrencies, forecastHorizonMonths } = settings;
  if (typeof language !== "string" || !LANGUAGE_PREFERENCES.includes(language)) {
    errors.push({ field: "language", code: "invalid-language" });
  }
  if (!isCurrencyCode(defaultCurrency)) {
    errors.push({ field: "defaultCurrency", code: "invalid-currency" });
  }
  if (!Array.isArray(trackedCurrencies) || !trackedCurrencies.every(isCurrencyCode)) {
    errors.push({ field: "trackedCurrencies", code: "invalid-currency" });
  } else if (new Set(trackedCurrencies).size !== trackedCurrencies.length) {
    errors.push({ field: "trackedCurrencies", code: "duplicate-currency" });
  } else if (typeof defaultCurrency === "string" && trackedCurrencies.includes(defaultCurrency)) {
    errors.push({ field: "trackedCurrencies", code: "default-currency-tracked" });
  }
  for (const field of ["lowBalanceThreshold", "largeExpenseThreshold"] as const) {
    const threshold = settings[field];
    if (typeof threshold !== "number" || !isMinorUnits(threshold)) {
      errors.push({ field, code: "invalid-threshold" });
    } else if (threshold < 0) {
      errors.push({ field, code: "negative-threshold" });
    }
  }
  if (
    typeof forecastHorizonMonths !== "number" ||
    !Number.isSafeInteger(forecastHorizonMonths) ||
    forecastHorizonMonths < 1 ||
    forecastHorizonMonths > MAX_FORECAST_HORIZON_MONTHS
  ) {
    errors.push({ field: "forecastHorizonMonths", code: "invalid-forecast-horizon" });
  }
  return errors;
}

/**
 * Applies `changes` to `current` and validates the result. Returns every validation error at once and never
 * mutates `current`. Also used to load stored settings: `updateSettings(DEFAULT_SETTINGS, stored)`.
 *
 * `changes` may be untrusted (e.g. parsed from storage): every field is checked at runtime, a value of the wrong
 * type is reported as an error instead of throwing, and keys that are not `Settings` fields are dropped.
 */
export function updateSettings(
  current: Settings,
  changes: Partial<Settings>,
): UpdateSettingsResult {
  const merged: UntrustedSettings = { ...current, ...changes };
  const errors = validate(merged);
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  // validate() has checked every field, so the merged values have the Settings types.
  const next = merged as Settings;
  return {
    ok: true,
    settings: Object.freeze({
      language: next.language,
      defaultCurrency: next.defaultCurrency,
      trackedCurrencies: Object.freeze([...next.trackedCurrencies]),
      lowBalanceThreshold: next.lowBalanceThreshold,
      largeExpenseThreshold: next.largeExpenseThreshold,
      forecastHorizonMonths: next.forecastHorizonMonths,
    }),
  };
}
