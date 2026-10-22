// Business rules of the settings repository (#78): defaults for a database with no row, per-field fallback for
// damaged fields, core's validation codes with nothing written on an invalid patch, and the onboarding timestamp
// that this repository never touches (#139).
import { DEFAULT_SETTINGS, toMinorUnits } from "@budget-lens/core";
import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  readSettings,
  runMigrations,
  type SettingsPatch,
  schema,
  updateStoredSettings,
} from "../src";
import { openTestDatabase, settingsRow } from "./helpers";

/** Changes as they may come from the UI: typed fields are not trusted at runtime (#126). */
const patch = (changes: Record<string, unknown>): SettingsPatch => changes as SettingsPatch;

const stored = () => db.select().from(schema.settings).get();

/** `base_currency` exactly as stored, for the cases where it is not a code core knows. */
const storedBaseCurrency = () =>
  db.all<{ base_currency: string }>(sql`SELECT base_currency FROM settings WHERE id = 1`)[0]
    ?.base_currency;

let db: ReturnType<typeof openTestDatabase>;
let deps: { readonly now: () => number };

beforeEach(() => {
  db = openTestDatabase();
  runMigrations(db);
  deps = { now: () => Date.UTC(2026, 9, 22) };
});

describe("settings repository", () => {
  it("reads the defaults on a fresh install, without writing anything", () => {
    // Arrange: a migrated database with no `settings` row.

    // Act
    const settings = readSettings(db);

    // Assert: the legacy amounts, in grosze.
    expect(settings).toEqual({
      language: "system",
      baseCurrency: "PLN",
      trackedCurrencies: ["USD", "EUR", "GBP"],
      lowBalanceThreshold: 500_000,
      largeExpenseThreshold: 1_000_000,
      forecastHorizonMonths: 13,
      rateMaxAgeBusinessDays: 2,
    });
    expect(stored()).toBeUndefined();
  });

  it("writes the settings a patch completes, keeps amounts as whole grosze and stamps updated_at", () => {
    // Arrange: nothing is stored yet, so the defaults complete the first write.

    // Act
    const result = updateStoredSettings(
      db,
      patch({ lowBalanceThreshold: 123_456, trackedCurrencies: ["JPY", "EUR"] }),
      deps,
    );

    // Assert
    const expected = {
      ...DEFAULT_SETTINGS,
      lowBalanceThreshold: 123_456,
      trackedCurrencies: ["JPY", "EUR"],
    };
    expect(result).toEqual({ ok: true, settings: expected });
    expect(readSettings(db)).toEqual(expected);
    expect(stored()).toMatchObject({
      id: 1,
      lowBalanceThresholdMinor: toMinorUnits(123_456),
      largeExpenseThresholdMinor: toMinorUnits(1_000_000),
      trackedCurrencies: ["JPY", "EUR"],
      updatedAt: new Date(Date.UTC(2026, 9, 22)),
    });
  });

  it("returns the core error codes of an invalid patch and leaves the stored row untouched", () => {
    // Arrange
    db.insert(schema.settings).values(settingsRow(1)).run();
    const before = stored();

    // Act: the base currency is still tracked, and the thresholds are negative and fractional.
    const result = updateStoredSettings(
      db,
      patch({ baseCurrency: "EUR", lowBalanceThreshold: -1, largeExpenseThreshold: 1000.5 }),
      deps,
    );

    // Assert
    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "trackedCurrencies", code: "base-currency-tracked" },
        { field: "lowBalanceThreshold", code: "negative-threshold" },
        { field: "largeExpenseThreshold", code: "invalid-threshold" },
      ],
    });
    expect(stored()).toEqual(before);
  });

  it("falls back to the default of a damaged field on read and keeps the stored fields that are valid", () => {
    // Arrange: a horizon over the core maximum and a base currency outside the supported table.
    db.insert(schema.settings).values(settingsRow(1)).run();
    db.run(
      sql`UPDATE settings SET forecast_horizon_months = 500, base_currency = 'XXX' WHERE id = 1`,
    );

    // Act
    const settings = readSettings(db);

    // Assert
    expect(settings.forecastHorizonMonths).toBe(13);
    expect(settings.baseCurrency).toBe("PLN");
    expect(settings.trackedCurrencies).toEqual(["EUR"]);
  });

  it("falls back to the default tracked list when the stored list is not readable", () => {
    // Arrange: a tracked list that is not JSON, with the other fields stored as valid values.
    db.insert(schema.settings).values(settingsRow(1)).run();
    updateStoredSettings(db, patch({ language: "en", lowBalanceThreshold: 250_000 }), deps);
    db.run(sql`UPDATE settings SET tracked_currencies = 'not json' WHERE id = 1`);

    // Act
    const settings = readSettings(db);

    // Assert
    expect(settings).toMatchObject({
      trackedCurrencies: ["USD", "EUR", "GBP"],
      language: "en",
      lowBalanceThreshold: 250_000,
    });
  });

  it("keeps the recorded onboarding confirmation through an update", () => {
    // Arrange: onboarding was confirmed before this repository existed for it (#139).
    db.insert(schema.settings).values(settingsRow(1)).run();
    db.run(sql`UPDATE settings SET onboarding_completed_at = 123 WHERE id = 1`);

    // Act
    expect(updateStoredSettings(db, patch({ language: "pl" }), deps).ok).toBe(true);

    // Assert
    expect(stored()).toMatchObject({
      language: "pl",
      onboardingCompletedAt: new Date(123),
      updatedAt: new Date(Date.UTC(2026, 9, 22)),
    });
  });

  it("keeps a base currency the patch does not mention, however the budget was onboarded", () => {
    // Arrange: the budget runs in EUR.
    db.insert(schema.settings)
      .values({ ...settingsRow(1), baseCurrency: "EUR", trackedCurrencies: ["USD"] })
      .run();

    // Act
    const result = updateStoredSettings(db, patch({ language: "pl" }), deps);

    // Assert
    expect(result.ok && result.settings.baseCurrency).toBe("EUR");
    expect(stored()).toMatchObject({ baseCurrency: "EUR", language: "pl" });
  });

  it("stores the base currency of a patch that changes it, with the tracked list that drops it", () => {
    // Arrange: moving the budget from PLN to EUR needs both fields in one patch (core's `base-currency-tracked`).
    db.insert(schema.settings).values(settingsRow(1)).run();

    // Act
    expect(
      updateStoredSettings(db, patch({ baseCurrency: "EUR", trackedCurrencies: ["USD"] }), deps).ok,
    ).toBe(true);

    // Assert
    expect(stored()).toMatchObject({
      baseCurrency: "EUR",
      trackedCurrencies: ["USD"],
      updatedAt: new Date(Date.UTC(2026, 9, 22)),
    });
  });

  it("refuses every write while the stored base currency is unreadable and leaves the row as it was", () => {
    // Arrange: a code that left the supported set (NBP table A) after onboarding was confirmed.
    db.insert(schema.settings).values(settingsRow(1)).run();
    db.run(
      sql`UPDATE settings SET base_currency = 'RUB', onboarding_completed_at = 123 WHERE id = 1`,
    );
    const before = stored();

    // Act: an unrelated change, which would otherwise have stored the default PLN in its place.
    const result = updateStoredSettings(db, patch({ language: "pl" }), deps);

    // Assert
    expect(result).toEqual({
      ok: false,
      errors: [{ field: "baseCurrency", code: "stored-base-currency-invalid" }],
    });
    expect(stored()).toEqual(before);
    expect(storedBaseCurrency()).toBe("RUB");
  });
});
