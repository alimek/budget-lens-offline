import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { type MigrationBundle, MigrationIntegrityError, runMigrations, schema } from "../src";
import schemaMigrations from "../src/migrations.generated";
import { item, openTestDatabase, ruleVersion } from "./helpers";

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
    expect(applied).toBe(1);
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
