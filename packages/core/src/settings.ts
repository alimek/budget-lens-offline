import { type CurrencyCode, isCurrencyCode } from "./currency";
import { isMinorUnits, type MinorUnits, toMinorUnits } from "./money";

/** UI languages the app ships in. */
export type Language = "pl" | "en";

/** The user's language choice; `"system"` follows the device language (resolved by the app's i18n layer). */
export type LanguagePreference = Language | "system";

/**
 * The single local settings model. Every calculation that needs a currency, a warning threshold or the forecast
 * horizon reads it from here, never from constants.
 *
 * Thresholds are amounts in minor units of `baseCurrency`.
 */
export interface Settings {
  readonly language: LanguagePreference;
  /**
   * Code of the currency all budget amounts are kept in; renamed from the legacy `default_currency` (#39).
   * Limited to the supported currencies, `CurrencyCode` (#126).
   */
  readonly baseCurrency: CurrencyCode;
  /** Codes of the currencies whose exchange rates are tracked (savings in other currencies). */
  readonly trackedCurrencies: readonly CurrencyCode[];
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
  baseCurrency: "PLN",
  trackedCurrencies: Object.freeze(["USD", "EUR", "GBP"] as const),
  lowBalanceThreshold: toMinorUnits(500_000),
  largeExpenseThreshold: toMinorUnits(1_000_000),
  forecastHorizonMonths: 13,
});

export type SettingsErrorCode =
  | "invalid-language"
  | "invalid-currency"
  | "unsupported-currency"
  | "duplicate-currency"
  | "base-currency-tracked"
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

const isIsoCode = (value: unknown): value is string =>
  typeof value === "string" && CURRENCY_CODE.test(value);

/** `invalid-currency` for a malformed code, `unsupported-currency` for a well-formed code outside the table. */
function currencyError(value: unknown): SettingsErrorCode | undefined {
  if (!isIsoCode(value)) {
    return "invalid-currency";
  }
  return isCurrencyCode(value) ? undefined : "unsupported-currency";
}

const isLanguagePreference = (value: unknown): boolean =>
  typeof value === "string" && LANGUAGE_PREFERENCES.includes(value);

const isForecastHorizon = (value: unknown): boolean =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 1 &&
  value <= MAX_FORECAST_HORIZON_MONTHS;

function trackedCurrenciesError(
  tracked: unknown,
  baseCurrency: unknown,
): SettingsErrorCode | undefined {
  if (!Array.isArray(tracked) || !Array.from(tracked).every(isIsoCode)) {
    return "invalid-currency";
  }
  if (!tracked.every(isCurrencyCode)) {
    return "unsupported-currency";
  }
  if (new Set(tracked).size !== tracked.length) {
    return "duplicate-currency";
  }
  return isCurrencyCode(baseCurrency) && tracked.includes(baseCurrency)
    ? "base-currency-tracked"
    : undefined;
}

function thresholdError(threshold: unknown): SettingsErrorCode | undefined {
  if (typeof threshold !== "number" || !isMinorUnits(threshold)) {
    return "invalid-threshold";
  }
  return threshold < 0 ? "negative-threshold" : undefined;
}

type Check = (settings: UntrustedSettings) => SettingsErrorCode | undefined;

/** One check per field, in the order errors are reported. */
const FIELD_CHECKS = {
  language: ({ language }) => (isLanguagePreference(language) ? undefined : "invalid-language"),
  baseCurrency: ({ baseCurrency }) => currencyError(baseCurrency),
  trackedCurrencies: ({ trackedCurrencies, baseCurrency }) =>
    trackedCurrenciesError(trackedCurrencies, baseCurrency),
  lowBalanceThreshold: ({ lowBalanceThreshold }) => thresholdError(lowBalanceThreshold),
  largeExpenseThreshold: ({ largeExpenseThreshold }) => thresholdError(largeExpenseThreshold),
  forecastHorizonMonths: ({ forecastHorizonMonths }) =>
    isForecastHorizon(forecastHorizonMonths) ? undefined : "invalid-forecast-horizon",
} satisfies Record<keyof Settings, Check>;

function validate(settings: UntrustedSettings): SettingsError[] {
  return Object.entries(FIELD_CHECKS).flatMap(([field, check]) => {
    const code = check(settings);
    return code === undefined ? [] : [{ field: field as keyof Settings, code }];
  });
}

/** Loads untrusted stored settings, falling back to defaults for each missing or invalid field. */
export function loadSettings(stored: unknown): Settings {
  if (
    typeof stored !== "object" ||
    stored === null ||
    (Object.getPrototypeOf(stored) !== Object.prototype && Object.getPrototypeOf(stored) !== null)
  ) {
    return DEFAULT_SETTINGS;
  }
  const loaded: Record<keyof Settings, unknown> = { ...DEFAULT_SETTINGS, ...stored };
  for (const field of Object.keys(FIELD_CHECKS) as (keyof Settings)[]) {
    if (field === "trackedCurrencies" && Array.isArray(loaded.trackedCurrencies)) {
      loaded.trackedCurrencies = Array.from(loaded.trackedCurrencies).filter(
        (currency) => currency !== loaded.baseCurrency,
      );
    }
    if (FIELD_CHECKS[field](loaded) !== undefined) {
      loaded[field] = DEFAULT_SETTINGS[field];
    }
  }
  // Every field has passed its check or received its default; only a fallback tracked list can still contain the
  // loaded base currency, so it is filtered out below.
  const next = loaded as Settings;
  return freezeSettings({
    ...next,
    trackedCurrencies: next.trackedCurrencies.filter((currency) => currency !== next.baseCurrency),
  });
}

/**
 * Applies `changes` to `current` and validates the result. Returns every validation error at once and never
 * mutates `current`. Use `loadSettings(stored)` to load stored settings with per-field defaults.
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
    settings: freezeSettings(next),
  };
}

function freezeSettings(next: Settings): Settings {
  return Object.freeze({
    language: next.language,
    baseCurrency: next.baseCurrency,
    trackedCurrencies: Object.freeze([...next.trackedCurrencies]),
    lowBalanceThreshold: next.lowBalanceThreshold,
    largeExpenseThreshold: next.largeExpenseThreshold,
    forecastHorizonMonths: next.forecastHorizonMonths,
  });
}
