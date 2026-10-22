// The settings repository (#78): the `settings` singleton row in, core `Settings` out. Every rule about what a
// valid settings value is stays in core (`loadSettings`, `updateSettings`, docs/domain/settings.md): this file
// only maps columns and decides what to write.
import {
  type CurrencyCode,
  type LanguagePreference,
  loadSettings,
  type MinorUnits,
  type Settings,
  type SettingsError,
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

/** The result of a write: the settings now stored, or every core validation error that blocked it. */
export type SettingsWriteResult =
  | { readonly ok: true; readonly settings: Settings }
  | { readonly ok: false; readonly errors: readonly SettingsError[] };

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

/**
 * The stored settings as core `Settings`, with `DEFAULT_SETTINGS` for every missing or invalid field
 * (`loadSettings`), so a damaged row is repaired on read and never throws (#88 pattern).
 *
 * A database without a `settings` row – a fresh install, before anything has been written – reads as
 * `DEFAULT_SETTINGS`. Reading writes nothing: the row appears with the first `updateStoredSettings`, which is
 * also how the app seeds the defaults (docs/domain/settings.md).
 */
export function readSettings(db: Database): Settings {
  const row = readStoredSettings(db);
  return loadSettings(row === undefined ? {} : storedSettings(row));
}

/** The core settings as columns. `onboarding_completed_at` is never written here (#139). */
function settingsValues(settings: Settings, updatedAt: Date) {
  return {
    id: SINGLETON_ID,
    language: settings.language,
    baseCurrency: settings.baseCurrency,
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
 * through `updateSettings`, and an invalid one returns core's error codes and writes nothing.
 *
 * The settings read first is the repaired one (`readSettings`), so a write also heals a damaged field: the
 * stored row afterwards holds the defaults for what was invalid.
 *
 * This is the only place that writes the singleton, so the base-currency lock of #139 belongs here: once
 * `onboarding_completed_at` is set, a `baseCurrency` patch is rejected as well.
 */
export function updateStoredSettings(
  db: Database,
  patch: SettingsPatch,
  deps: SettingsRepositoryDeps,
): SettingsWriteResult {
  const result = updateSettings(readSettings(db), patch);
  if (!result.ok) {
    return result;
  }
  const values = settingsValues(result.settings, new Date(deps.now()));
  // UPSERT, never INSERT OR REPLACE: the latter deletes the row and bypasses the update hook live reads use.
  db.insert(schema.settings)
    .values({ ...values, onboardingCompletedAt: null })
    .onConflictDoUpdate({
      target: schema.settings.id,
      // The conflict update lists only the settings columns, so `onboarding_completed_at` keeps its value (#139).
      set: values,
    })
    .run();
  return { ok: true, settings: result.settings };
}
