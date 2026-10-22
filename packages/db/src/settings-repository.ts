// The settings repository (#78): the `settings` singleton row in, core `Settings` out. Every rule about what a
// valid settings value is stays in core (`loadSettings`, `updateSettings`, docs/domain/settings.md): this file
// only maps columns and decides what to write.
import {
  type CurrencyCode,
  isCurrencyCode,
  type LanguagePreference,
  loadSettings,
  type MinorUnits,
  type Settings,
  type SettingsErrorCode,
  updateSettings,
} from "@budget-lens/core";
import { eq, sql } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

/**
 * A synchronous Drizzle SQLite database with schema v1: expo-sqlite in the app, sql.js in tests.
 */
// biome-ignore lint/suspicious/noExplicitAny: accepts databases with any schema and run-result type.
type Database = BaseSQLiteDatabase<"sync", any, any>;

/** `updated_at` is injected; the repository reads no clock. */
export interface SettingsRepositoryDeps {
  /** UTC epoch milliseconds for the `updated_at` column. */
  readonly now: () => number;
}

/** The table `readSettings` reads. A live hook re-runs it when this table changes (#35 §4). */
export const SETTINGS_TABLES = ["settings"] as const;

/** The id the singleton CHECK enforces. */
const SINGLETON_ID = 1;

/** A change to one or more settings fields; a key that is not a `Settings` field is dropped by core. */
export type SettingsPatch = Partial<Settings>;

/**
 * Why a write was refused: core's field codes, plus `stored-base-currency-invalid` for a stored base currency
 * core no longer recognises, which no patch of ours can repair.
 */
export type SettingsWriteErrorCode = SettingsErrorCode | "stored-base-currency-invalid";

/** A rejected write, as a field and a code for the UI to translate; never a message. */
export interface SettingsWriteError {
  readonly field: keyof Settings;
  readonly code: SettingsWriteErrorCode;
}

/** The result of a write: the settings now stored, or every error that blocked it. */
export type SettingsWriteResult =
  | { readonly ok: true; readonly settings: Settings }
  | { readonly ok: false; readonly errors: readonly SettingsWriteError[] };

/**
 * The columns `readSettings` maps, with `tracked_currencies` as the raw JSON text: Drizzle's JSON column would
 * throw on a damaged value while mapping, and a damaged field must fall back to its default on its own.
 */
const storedSettingsSelection = {
  language: schema.settings.language,
  baseCurrency: schema.settings.baseCurrency,
  trackedCurrencies: sql<string | null>`${schema.settings.trackedCurrencies}`,
  lowBalanceThresholdMinor: schema.settings.lowBalanceThresholdMinor,
  largeExpenseThresholdMinor: schema.settings.largeExpenseThresholdMinor,
  forecastHorizonMonths: schema.settings.forecastHorizonMonths,
  rateMaxAgeBusinessDays: schema.settings.rateMaxAgeBusinessDays,
};

/** The static types of those columns. Stored data is untrusted at runtime; core validates every field. */
interface StoredSettingsRow {
  readonly language: LanguagePreference;
  readonly baseCurrency: CurrencyCode;
  readonly trackedCurrencies: string | null;
  readonly lowBalanceThresholdMinor: MinorUnits;
  readonly largeExpenseThresholdMinor: MinorUnits;
  readonly forecastHorizonMonths: number;
  readonly rateMaxAgeBusinessDays: number;
}

/** Unparseable JSON is `undefined`, which `loadSettings` treats as a missing field. */
function parseTrackedCurrencies(stored: string | null): unknown {
  if (stored === null) {
    return undefined;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

/** The row as `loadSettings` wants it: columns under their core field names. */
function storedSettings(row: StoredSettingsRow) {
  return {
    language: row.language,
    baseCurrency: row.baseCurrency,
    trackedCurrencies: parseTrackedCurrencies(row.trackedCurrencies),
    lowBalanceThreshold: row.lowBalanceThresholdMinor,
    largeExpenseThreshold: row.largeExpenseThresholdMinor,
    forecastHorizonMonths: row.forecastHorizonMonths,
    rateMaxAgeBusinessDays: row.rateMaxAgeBusinessDays,
  };
}

function readStoredSettings(db: Database): StoredSettingsRow | undefined {
  return db
    .select(storedSettingsSelection)
    .from(schema.settings)
    .where(eq(schema.settings.id, SINGLETON_ID))
    .get();
}

/** A missing row is loaded as an empty object, which `loadSettings` answers with every default. */
function loadedSettings(row: StoredSettingsRow | undefined): Settings {
  return loadSettings(row === undefined ? {} : storedSettings(row));
}

/**
 * The stored settings as core `Settings`, with `DEFAULT_SETTINGS` for every missing or invalid field
 * (`loadSettings`), so a damaged row is repaired on read and never throws (#88 pattern).
 *
 * A database without a `settings` row – a fresh install, before anything has been written – reads as
 * `DEFAULT_SETTINGS`. Reading writes nothing: the row appears with the first `updateStoredSettings`, which is
 * also how the app seeds the defaults (docs/domain/settings.md).
 */
export function readSettings(db: Database): Settings {
  return loadedSettings(readStoredSettings(db));
}

/** The columns a write stores, except the id and `base_currency`; `onboarding_completed_at` is never one of them. */
function healedValues(settings: Settings, updatedAt: Date) {
  return {
    language: settings.language,
    trackedCurrencies: settings.trackedCurrencies,
    lowBalanceThresholdMinor: settings.lowBalanceThreshold,
    largeExpenseThresholdMinor: settings.largeExpenseThreshold,
    forecastHorizonMonths: settings.forecastHorizonMonths,
    rateMaxAgeBusinessDays: settings.rateMaxAgeBusinessDays,
    updatedAt,
  };
}

/**
 * Applies `patch` to the stored settings and stores the result. What is valid is core's decision: the patch goes
 * through `updateSettings`, and an invalid one returns its error codes and writes nothing.
 *
 * The settings read first are the repaired ones, so a write also heals a damaged field. `base_currency` is never
 * healed or rewritten: it is the currency of every amount in the budget, so it changes only when the patch asks
 * for it, and a stored code core no longer recognises refuses the whole write with
 * `stored-base-currency-invalid` instead of being replaced by the default.
 *
 * This is the only place that writes the singleton, so the base-currency lock of #139 belongs here: once
 * `onboarding_completed_at` is set, a `baseCurrency` patch is rejected as well.
 */
export function updateStoredSettings(
  db: Database,
  patch: SettingsPatch,
  deps: SettingsRepositoryDeps,
): SettingsWriteResult {
  const row = readStoredSettings(db);
  // Every stored amount is in the base currency, so an unreadable one is damage to report, not a field to heal.
  if (row !== undefined && !isCurrencyCode(row.baseCurrency)) {
    return { ok: false, errors: [{ field: "baseCurrency", code: "stored-base-currency-invalid" }] };
  }
  const result = updateSettings(loadedSettings(row), patch);
  if (!result.ok) {
    return result;
  }
  const healed = healedValues(result.settings, new Date(deps.now()));
  const values = {
    id: SINGLETON_ID,
    baseCurrency: result.settings.baseCurrency,
    ...healed,
    onboardingCompletedAt: null,
  };
  // UPSERT, never INSERT OR REPLACE: the latter deletes the row and bypasses the update hook live reads use.
  // On conflict the update writes `base_currency` only when the patch asked for it, so an unrelated change never
  // restates the currency of the budget, and `onboarding_completed_at` keeps its value (#139).
  const set =
    patch.baseCurrency === undefined
      ? healed
      : { ...healed, baseCurrency: result.settings.baseCurrency };
  db.insert(schema.settings)
    .values(values)
    .onConflictDoUpdate({ target: schema.settings.id, set })
    .run();
  return { ok: true, settings: result.settings };
}
