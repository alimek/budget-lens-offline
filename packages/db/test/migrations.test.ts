import { toMinorUnits, toYearMonth } from "@budget-lens/core";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  type MigrationBundle,
  MigrationIntegrityError,
  runMigrations,
  runMigrationsWithSafetyCopy,
  schema,
} from "../src";
import schemaMigrations from "../src/migrations.generated";
import { item, openTestDatabase, openTestDatabaseFile, ruleVersion, sqliteError } from "./helpers";

/** A later schema version that changes a column default on `items`: drizzle-kit 0.31.11 output, verbatim. */
const REBUILD_ITEMS = `PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE \`__new_items\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`kind\` text NOT NULL,
	\`name\` text NOT NULL,
	\`currency\` text NOT NULL,
	\`note\` text,
	\`sort_order\` integer DEFAULT 1 NOT NULL,
	\`archived_at\` integer,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL,
	CONSTRAINT "items_kind_chk" CHECK("kind" IN ('expense', 'income')),
	CONSTRAINT "items_currency_chk" CHECK("currency" GLOB '[A-Z][A-Z][A-Z]')
);
--> statement-breakpoint
INSERT INTO \`__new_items\`("id", "kind", "name", "currency", "note", "sort_order", "archived_at", "created_at", "updated_at") SELECT "id", "kind", "name", "currency", "note", "sort_order", "archived_at", "created_at", "updated_at" FROM \`items\`;--> statement-breakpoint
DROP TABLE \`items\`;--> statement-breakpoint
ALTER TABLE \`__new_items\` RENAME TO \`items\`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX \`items_kind_archived_idx\` ON \`items\` (\`kind\`,\`archived_at\`);`;

/** The shipped migrations plus one more, as a later app release would ship them. */
function withMigration(tag: string, query: string): MigrationBundle {
  const last = schemaMigrations.journal.entries.at(-1);
  const idx = schemaMigrations.journal.entries.length;
  const entry = { idx, when: (last?.when ?? 0) + 1, tag, breakpoints: true };
  return {
    journal: { entries: [...schemaMigrations.journal.entries, entry] },
    migrations: { ...schemaMigrations.migrations, [`m${String(idx).padStart(4, "0")}`]: query },
  };
}

/** The shipped migrations up to `count` entries: a database migrated with them is at that schema version. */
function shippedUpTo(count: number): MigrationBundle {
  const entries = schemaMigrations.journal.entries.slice(0, count);
  const migrations: Record<string, string> = {};
  for (const entry of entries) {
    const key = `m${String(entry.idx).padStart(4, "0")}`;
    const sqlText = schemaMigrations.migrations[key];
    if (sqlText === undefined) throw new Error(`missing migration ${key}`);
    migrations[key] = sqlText;
  }
  return { journal: { entries }, migrations };
}

const at = new Date(Date.UTC(2026, 9, 1));

/** An override of the shape core allows: `skipped` and an amount are mutually exclusive. */
const amountOverride: typeof schema.occurrenceOverrides.$inferInsert = {
  id: "override-1",
  itemId: "item-1",
  month: toYearMonth("2026-10"),
  amountMinor: toMinorUnits(320_000),
  skipped: false,
  note: null,
  createdAt: at,
  updatedAt: at,
};

const skippedOverride: typeof schema.occurrenceOverrides.$inferInsert = {
  ...amountOverride,
  id: "override-2",
  month: toYearMonth("2026-11"),
  amountMinor: null,
  skipped: true,
  note: "on holiday",
};

const tableNames = (db: ReturnType<typeof openTestDatabase>) =>
  db
    .all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    )
    .map((row) => row.name);

const foreignKeysEnabled = (db: ReturnType<typeof openTestDatabase>) =>
  db.all<{ foreign_keys: number }>(sql`PRAGMA foreign_keys`)[0]?.foreign_keys === 1;

describe("runMigrations", () => {
  it("creates schema v1 on first launch, with foreign keys enforced", () => {
    // Arrange
    const db = openTestDatabase();

    // Act
    const applied = runMigrations(db);

    // Assert
    expect(applied).toBe(schemaMigrations.journal.entries.length);
    expect(tableNames(db)).toEqual([
      "__drizzle_migrations",
      "app_meta",
      "closed_occurrences",
      "exchange_rates",
      "item_rule_versions",
      "items",
      "months",
      "occurrence_overrides",
      "payment_statuses",
      "savings",
      "settings",
    ]);
    expect(foreignKeysEnabled(db)).toBe(true);
  });

  it("keeps both current rate sources for a currency across migrations", () => {
    // Arrange
    const db = openTestDatabase();
    runMigrations(db);
    const quote = { currency: "EUR" as const, effectiveDate: "2026-10-20", fetchedAt: new Date(1) };
    const rates = [
      { ...quote, source: "nbp" as const, mid: "4.25" },
      { ...quote, source: "manual" as const, mid: "4.30" },
    ];
    db.insert(schema.exchangeRates).values(rates).run();

    // Act
    const applied = runMigrations(db, withMigration("0001_rebuild_items", REBUILD_ITEMS));

    // Assert
    expect(applied).toBe(1);
    expect(db.select().from(schema.exchangeRates).all()).toEqual(rates);
    expect(foreignKeysEnabled(db)).toBe(true);
  });

  it("applies nothing and keeps the data when the schema is already current", () => {
    // Arrange
    const db = openTestDatabase();
    runMigrations(db);
    db.insert(schema.items).values(item("item-1")).run();

    // Act
    const applied = runMigrations(db);

    // Assert
    expect(applied).toBe(0);
    expect(db.select().from(schema.items).all()).toHaveLength(1);
  });

  it("upgrades with a table rebuild without losing child rows of the rebuilt table", () => {
    // Arrange
    const db = openTestDatabase();
    runMigrations(db);
    db.insert(schema.items).values(item("item-1")).run();
    db.insert(schema.itemRuleVersions)
      .values(ruleVersion("version-1", "item-1", "2026-10"))
      .run();

    // Act
    const applied = runMigrations(db, withMigration("0001_rebuild_items", REBUILD_ITEMS));

    // Assert
    expect(applied).toBe(1);
    expect(db.select().from(schema.itemRuleVersions).all()).toHaveLength(1);
    expect(db.all(sql`PRAGMA foreign_key_check`)).toEqual([]);
    expect(foreignKeysEnabled(db)).toBe(true);
  });

  it("rolls back every pending migration when a later statement fails", () => {
    // Arrange
    const db = openTestDatabase();
    runMigrations(db);
    const recorded = db.all(sql`SELECT * FROM __drizzle_migrations`);
    const pending = withMigration(
      "0001_failing",
      `
      INSERT INTO app_meta (key, value) VALUES ('upgrade', 'pending');
      --> statement-breakpoint
      INSERT INTO missing_table (value) VALUES ('fail');
    `,
    );

    // Act
    const migrate = () => runMigrations(db, pending);

    // Assert
    expect(migrate).toThrow();
    expect(db.select().from(schema.appMeta).all()).toEqual([]);
    expect(db.all(sql`SELECT * FROM __drizzle_migrations`)).toEqual(recorded);
    expect(foreignKeysEnabled(db)).toBe(true);
  });

  it("rebuilds occurrence_overrides for the shape CHECK without losing the stored overrides", () => {
    // Arrange
    const db = openTestDatabase();
    runMigrations(db, shippedUpTo(1));
    db.insert(schema.items).values(item("item-1")).run();
    db.insert(schema.occurrenceOverrides).values([amountOverride, skippedOverride]).run();
    db.insert(schema.paymentStatuses)
      .values({ itemId: "item-1", month: toYearMonth("2026-10"), settledAt: at })
      .run();

    // Act
    const applied = runMigrations(db);

    // Assert
    expect(applied).toBe(schemaMigrations.journal.entries.length - 1);
    expect(db.select().from(schema.occurrenceOverrides).all()).toEqual([
      amountOverride,
      skippedOverride,
    ]);
    expect(db.select().from(schema.paymentStatuses).all()).toEqual([
      { itemId: "item-1", month: toYearMonth("2026-10"), settledAt: at },
    ]);
    expect(db.all(sql`PRAGMA foreign_key_check`)).toEqual([]);
  });

  it("refuses an override that is not exactly one of an amount or a skip after the rebuild", () => {
    // Arrange
    const db = openTestDatabase();
    runMigrations(db, shippedUpTo(1));
    runMigrations(db);
    db.insert(schema.items).values(item("item-1")).run();
    const both = { ...amountOverride, id: "override-both", skipped: true };
    const neither = { ...amountOverride, id: "override-neither", amountMinor: null };

    // Act
    const bothError = sqliteError(() => db.insert(schema.occurrenceOverrides).values(both).run());
    const neitherError = sqliteError(() =>
      db.insert(schema.occurrenceOverrides).values(neither).run(),
    );

    // Assert
    expect(bothError).toContain("CHECK constraint failed: overrides_shape_chk");
    expect(neitherError).toContain("CHECK constraint failed: overrides_shape_chk");
    expect(db.select().from(schema.occurrenceOverrides).all()).toEqual([]);
  });

  it("restores the pre-migration copy when the shape CHECK rebuild meets a row that is not an override", () => {
    // Arrange: a v1 database holding the one row 0001 cannot rebuild: neither an amount nor a skip.
    const file = openTestDatabaseFile();
    runMigrations(file.connect(), shippedUpTo(1));
    file.connect().insert(schema.items).values(item("item-1")).run();
    const neither = { ...amountOverride, amountMinor: null, skipped: false };
    file.connect().insert(schema.occurrenceOverrides).values(neither).run();

    // Act
    const migrate = () => runMigrationsWithSafetyCopy(file.connect(), file.copy);

    // Assert: nothing is half-migrated – the copy is put back, and the launch after it sees v1 as it was (#75).
    expect(migrate).toThrow();
    expect(file.calls).toEqual({ created: 1, restored: 1, discarded: 0 });
    expect(file.connect().select().from(schema.occurrenceOverrides).all()).toEqual([neither]);
    expect(file.connect().all(sql`SELECT * FROM __drizzle_migrations`)).toHaveLength(1);
  });

  it("stops with an integrity error when a migration leaves rows without their parent", () => {
    // Arrange
    const db = openTestDatabase();
    runMigrations(db);
    db.insert(schema.items).values(item("item-1")).run();
    db.insert(schema.itemRuleVersions)
      .values(ruleVersion("version-1", "item-1", "2026-10"))
      .run();
    const orphaning = withMigration("0001_bad", "DELETE FROM `items`;");

    // Act
    const migrate = () => runMigrations(db, orphaning);

    // Assert
    expect(migrate).toThrow(MigrationIntegrityError);
    expect(foreignKeysEnabled(db)).toBe(true);
    expect(db.select().from(schema.items).where(eq(schema.items.id, "item-1")).all()).toEqual([]);
  });
});
