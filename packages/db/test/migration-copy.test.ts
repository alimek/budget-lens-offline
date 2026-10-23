import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  type MigrationBundle,
  MigrationIntegrityError,
  type MigrationSafetyCopy,
  runMigrations,
  runMigrationsWithSafetyCopy,
  schema,
} from "../src";
import schemaMigrations from "../src/migrations.generated";
import { item, openTestDatabaseFile, ruleVersion } from "./helpers";

/** What a launch does: `file.connect()` opens the current file, `file.copy` is the pre-migration copy. */
const databaseFile = openTestDatabaseFile;

/** The shipped migrations plus one more entry, as a later app release would ship them. */
function withMigration(tag: string, query: string): MigrationBundle {
  const last = schemaMigrations.journal.entries.at(-1);
  const idx = schemaMigrations.journal.entries.length;
  return {
    journal: {
      entries: [
        ...schemaMigrations.journal.entries,
        { idx, when: (last?.when ?? 0) + 1, tag, breakpoints: true },
      ],
    },
    migrations: { ...schemaMigrations.migrations, [`m${String(idx).padStart(4, "0")}`]: query },
  };
}

/** What the launch after a restored copy sees: the file reopened. */
const reopenedRows = (file: ReturnType<typeof databaseFile>, table: "items" | "itemRuleVersions") =>
  file.connect().select().from(schema[table]).all();

const bookkeeping = (file: ReturnType<typeof databaseFile>) =>
  file.connect().all(sql`SELECT * FROM __drizzle_migrations`);

describe("runMigrationsWithSafetyCopy", () => {
  it("takes no copy while the schema is current and discards the one from an earlier launch", () => {
    // Arrange
    const file = databaseFile();
    runMigrations(file.connect());
    const { copy, calls } = file;
    // A copy left behind by the launch that ran the migrations; only this launch is counted.
    copy.create();
    calls.created = 0;

    // Act
    const applied = runMigrationsWithSafetyCopy(file.connect(), copy);

    // Assert
    expect(applied).toBe(0);
    expect(calls).toEqual({ created: 0, restored: 0, discarded: 1 });
  });

  it("takes a copy on the launch that has migrations to apply", () => {
    // Arrange
    const file = databaseFile();
    const { copy, calls } = file;

    // Act
    const applied = runMigrationsWithSafetyCopy(file.connect(), copy);

    // Assert
    expect(applied).toBe(schemaMigrations.journal.entries.length);
    expect(calls).toEqual({ created: 1, restored: 0, discarded: 0 });
  });

  it("restores the copy and stops when a later migration statement fails", () => {
    // Arrange
    const file = databaseFile();
    runMigrations(file.connect());
    file.connect().insert(schema.items).values(item("item-1")).run();
    const { copy, calls } = file;
    const failing = withMigration(
      "0001_failing",
      "INSERT INTO `app_meta` (`key`, `value`) VALUES ('upgrade', 'done');--> statement-breakpoint\nINSERT INTO `missing_table` (`value`) VALUES ('fail');",
    );

    // Act
    const migrate = () => runMigrationsWithSafetyCopy(file.connect(), copy, failing);

    // Assert
    expect(migrate).toThrow();
    expect(calls).toEqual({ created: 1, restored: 1, discarded: 0 });
    expect(reopenedRows(file, "items")).toHaveLength(1);
    expect(
      file.connect().select().from(schema.appMeta).where(eq(schema.appMeta.key, "upgrade")).all(),
    ).toEqual([]);
    expect(bookkeeping(file)).toHaveLength(schemaMigrations.journal.entries.length);
  });

  it("brings the data back when a committed migration leaves rows without their parent", () => {
    // Arrange
    const file = databaseFile();
    runMigrations(file.connect());
    const db = file.connect();
    db.insert(schema.items).values(item("item-1")).run();
    db.insert(schema.itemRuleVersions)
      .values(ruleVersion("version-1", "item-1", "2026-10"))
      .run();
    const { copy } = file;
    const orphaning = withMigration("0001_orphan", "DELETE FROM `items`;");

    // Act
    const migrate = () => runMigrationsWithSafetyCopy(db, copy, orphaning);

    // Assert
    expect(migrate).toThrow(MigrationIntegrityError);
    expect(reopenedRows(file, "items")).toHaveLength(1);
    expect(reopenedRows(file, "itemRuleVersions")).toHaveLength(1);
    expect(bookkeeping(file)).toHaveLength(schemaMigrations.journal.entries.length);
  });

  it("keeps the copy and says so when putting it back fails (#75 R1)", () => {
    // Arrange
    const file = databaseFile();
    runMigrations(file.connect());
    const { copy, calls } = file;
    const failing = withMigration(
      "0001_failing",
      "INSERT INTO `missing_table` (`value`) VALUES ('fail');",
    );
    const stuckCopy: MigrationSafetyCopy = {
      create: () => copy.create(),
      discard: () => copy.discard(),
      restore: () => {
        throw new Error("The copy could not be moved into place");
      },
    };

    // Act
    const migrate = () => runMigrationsWithSafetyCopy(file.connect(), stuckCopy, failing);

    // Assert: the failed restore is what the caller learns about, and it never claims a restore happened.
    expect(migrate).toThrow(/could not be moved into place/);
    // The copy is the only state left worth keeping, so nothing here may discard it (#75 R1).
    expect(calls).toEqual({ created: 1, restored: 0, discarded: 0 });
  });
});
