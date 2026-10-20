import { sql, type TablesRelationalConfig } from "drizzle-orm";
import type { MigrationMeta } from "drizzle-orm/migrator";
import type { BaseSQLiteDatabase, SQLiteSession, SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import type { MigrationBundle } from "./migration-bundle";
import schemaMigrations from "./migrations.generated";

/** A synchronous Drizzle SQLite database: expo-sqlite in the app, sql.js in tests. */
// biome-ignore lint/suspicious/noExplicitAny: accepts databases with any schema and run-result type.
type SyncDatabase = BaseSQLiteDatabase<"sync", any, any>;

/** `PRAGMA foreign_key_check` found rows whose parent is missing after the migrations were committed. */
export class MigrationIntegrityError extends Error {
  readonly violations: readonly unknown[];

  constructor(violations: readonly unknown[]) {
    super(`Foreign key check failed after migrations (${violations.length} violations)`);
    this.name = "MigrationIntegrityError";
    this.violations = violations;
  }
}

/** The bundle in the form `SQLiteSyncDialect.migrate` takes, as Drizzle's expo migrator builds it. */
function toMigrationMeta({ journal, migrations }: MigrationBundle): MigrationMeta[] {
  return journal.entries.map((entry) => {
    const query = migrations[`m${String(entry.idx).padStart(4, "0")}`];
    if (query === undefined) {
      throw new Error(`Missing migration: ${entry.tag}`);
    }
    return {
      sql: query.split("--> statement-breakpoint"),
      bps: entry.breakpoints,
      folderMillis: entry.when,
      hash: "",
    };
  });
}

/** Rows in Drizzle's `__drizzle_migrations` bookkeeping table; 0 before the first run. */
function appliedCount(db: SyncDatabase): number {
  const [table] = db.all(
    sql`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'`,
  );
  if (table === undefined) {
    return 0;
  }
  const [row] = db.all<{ count: number }>(sql`SELECT count(*) AS count FROM __drizzle_migrations`);
  return row?.count ?? 0;
}

/**
 * Applies pending migrations and returns how many were applied (0 when the schema is current).
 *
 * Use this instead of Drizzle's `useMigrations`/`migrate` (#35): Drizzle runs all pending migrations in one
 * transaction, where `PRAGMA foreign_keys` is a no-op, so drizzle-kit's table rebuilds would fail on RESTRICT
 * foreign keys. Foreign keys are therefore switched off outside the transaction, checked with
 * `PRAGMA foreign_key_check` after it, and always switched back on.
 *
 * Call it after the database is opened (and, from #75, keyed) and before any other query.
 */
export function runMigrations(
  db: SyncDatabase,
  bundle: MigrationBundle = schemaMigrations,
): number {
  // Drizzle's sync migrator, as `migrate()` from drizzle-orm/expo-sqlite/migrator calls it (that module also
  // imports React for `useMigrations`). `dialect` and `session` are internal fields of every Drizzle database.
  const { dialect, session } = db as unknown as {
    dialect: SQLiteSyncDialect;
    session: SQLiteSession<"sync", unknown, Record<string, unknown>, TablesRelationalConfig>;
  };
  db.run(sql`PRAGMA foreign_keys = OFF`);
  try {
    const before = appliedCount(db);
    dialect.migrate(toMigrationMeta(bundle), session);
    const violations = db.all(sql`PRAGMA foreign_key_check`);
    if (violations.length > 0) {
      throw new MigrationIntegrityError(violations);
    }
    return appliedCount(db) - before;
  } finally {
    db.run(sql`PRAGMA foreign_keys = ON`);
  }
}
