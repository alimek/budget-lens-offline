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
 * When the last applied migration was generated, as Drizzle reads it: the newest row of its bookkeeping table,
 * or 0 when nothing has been applied yet. Drizzle applies entries newer than this and nothing older
 * ([drizzle-orm #5769](https://github.com/drizzle-team/drizzle-orm/issues/5769)).
 */
function lastAppliedWhen(db: SyncDatabase): number {
  const [table] = db.all(
    sql`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'`,
  );
  if (table === undefined) {
    return 0;
  }
  const [row] = db.all<{ created_at: number }>(
    sql`SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1`,
  );
  return row?.created_at ?? 0;
}

/** How many migrations of the bundle are still to be applied (0 when the schema is current). */
function countPendingMigrations(
  db: SyncDatabase,
  bundle: MigrationBundle = schemaMigrations,
): number {
  const lastApplied = lastAppliedWhen(db);
  return bundle.journal.entries.filter((entry) => entry.when > lastApplied).length;
}

/**
 * A copy of the database file, kept while migrations run (#35 Q3, #75). The app owns the files; this package only
 * decides when each step happens.
 */
export interface MigrationSafetyCopy {
  /**
   * Make sure a copy of the database as it is now is being kept. A copy left by an earlier launch is the older
   * state and the more valuable one, so it is kept rather than replaced (#75 R1).
   */
  create(): void;
  /**
   * Put that copy back in place of the live database file, atomically enough that a crash leaves either the old
   * file or the full copy, never half of either. Throws when it could not; the copy then stays where it is, so
   * the caller shows its one recovery screen and never claims the database was restored (#75 R1).
   */
  restore(): void;
  /** Delete a copy left by an earlier launch: the schema is current, so it is no longer needed. */
  discard(): void;
}

/**
 * Apply pending migrations with a copy taken first, and put that copy back if anything fails.
 *
 * A copy is taken only when migrations are pending (#35 Q3); when none are, a copy left by an earlier launch is
 * discarded. On any failure the copy is restored and the error is rethrown, so the caller shows the recovery
 * screen instead of querying a connection that no longer matches the file on disk, and a `MigrationIntegrityError`
 * raised after the commit is undone by the copy – the check itself cannot roll back (#35 §2). When putting the
 * copy back also fails, that error is what the caller sees and the copy is left where it is: nothing this wrapper
 * does deletes a file.
 */
export function runMigrationsWithSafetyCopy(
  db: SyncDatabase,
  safetyCopy: MigrationSafetyCopy,
  bundle: MigrationBundle = schemaMigrations,
): number {
  if (countPendingMigrations(db, bundle) === 0) {
    safetyCopy.discard();
    return 0;
  }
  safetyCopy.create();
  try {
    return runMigrations(db, bundle);
  } catch (error) {
    // A restore that fails here leaves the copy on disk, so the older state survives either way and the caller
    // shows the same recovery screen for both errors (#75 R1).
    safetyCopy.restore();
    throw error;
  }
}

/**
 * Applies pending migrations and returns how many were applied (0 when the schema is current).
 *
 * Use this instead of Drizzle's `useMigrations`/`migrate` (#35): Drizzle runs all pending migrations in one
 * transaction, where `PRAGMA foreign_keys` is a no-op, so drizzle-kit's table rebuilds would fail on RESTRICT
 * foreign keys. Foreign keys are therefore switched off outside the transaction, checked with
 * `PRAGMA foreign_key_check` after it, and always switched back on.
 *
 * Call it after the database is opened and before any other query; the app calls it through
 * `runMigrationsWithSafetyCopy`, which keeps a copy of the file (#35 Q3).
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
