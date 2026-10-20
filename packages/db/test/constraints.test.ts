import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { runMigrations, schema } from "../src";
import {
  activeMonth,
  item,
  openTestDatabase,
  ruleVersion,
  settingsRow,
  sqliteError,
} from "./helpers";

describe("schema v1 constraints", () => {
  let db: ReturnType<typeof openTestDatabase>;

  beforeEach(() => {
    db = openTestDatabase();
    runMigrations(db);
  });

  it("allows only one active month", () => {
    // Arrange
    db.insert(schema.months).values(activeMonth("2026-10")).run();

    // Act
    const error = sqliteError(() => db.insert(schema.months).values(activeMonth("2026-11")).run());

    // Assert
    expect(error).toContain("UNIQUE constraint failed: months.status");
  });

  it("allows one rule version per item and effective month", () => {
    // Arrange
    db.insert(schema.items).values(item("item-1")).run();
    db.insert(schema.itemRuleVersions)
      .values(ruleVersion("version-1", "item-1", "2026-10"))
      .run();

    // Act
    const error = sqliteError(() =>
      db
        .insert(schema.itemRuleVersions)
        .values(ruleVersion("version-2", "item-1", "2026-10"))
        .run(),
    );

    // Assert
    expect(error).toContain(
      "UNIQUE constraint failed: item_rule_versions.item_id, item_rule_versions.effective_from",
    );
  });

  it("keeps one current rate for each source in a currency", () => {
    // Arrange
    const quote = {
      currency: "EUR" as const,
      mid: "4.25",
      effectiveDate: "2026-10-20",
      fetchedAt: new Date(1),
    };
    db.insert(schema.exchangeRates)
      .values([
        { ...quote, source: "nbp" },
        { ...quote, source: "manual" },
      ])
      .run();

    // Act
    const error = sqliteError(() =>
      db
        .insert(schema.exchangeRates)
        .values({ ...quote, source: "nbp", mid: "4.30" })
        .run(),
    );

    // Assert
    expect(error).toContain(
      "UNIQUE constraint failed: exchange_rates.currency, exchange_rates.source",
    );
    expect(db.select().from(schema.exchangeRates).all()).toHaveLength(2);
  });

  it("keeps settings a single row", () => {
    // Arrange
    db.insert(schema.settings).values(settingsRow(1)).run();

    // Act
    const error = sqliteError(() => db.insert(schema.settings).values(settingsRow(2)).run());

    // Assert
    expect(error).toContain("CHECK constraint failed: settings_singleton_chk");
  });

  it("requires an explicit item currency", () => {
    // Arrange
    const { currency: _, ...withoutCurrency } = item("item-1");

    // Act
    const error = sqliteError(() =>
      db
        .insert(schema.items)
        .values(withoutCurrency as typeof schema.items.$inferInsert)
        .run(),
    );

    // Assert
    expect(error).toContain("NOT NULL constraint failed: items.currency");
  });

  it("refuses to delete an item that still has rule versions", () => {
    // Arrange
    db.insert(schema.items).values(item("item-1")).run();
    db.insert(schema.itemRuleVersions)
      .values(ruleVersion("version-1", "item-1", "2026-10"))
      .run();

    // Act
    const error = sqliteError(() =>
      db.delete(schema.items).where(eq(schema.items.id, "item-1")).run(),
    );

    // Assert
    expect(error).toContain("FOREIGN KEY constraint failed");
  });
});
