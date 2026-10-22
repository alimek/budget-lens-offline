/**
 * The names of the files the app keeps in expo-sqlite's database directory, and the rules for moving them.
 * Pure on purpose: the filesystem work in `database-files.ts` follows these names, and the names are where the
 * atomic-restore rule of #75 R1 and the rollback-journal rules of #75 R5 are decided, so they are worth
 * testing on their own.
 */

/** The live database. */
export const DATABASE_NAME = "budget-lens.db";

/** The encrypted copy taken before a migration (#35 Q3). */
export const COPY_NAME = "budget-lens.pre-migration.db";

/** The file a restore is copied into before it is moved over the live database (#75 R1). */
export const RESTORE_NAME = "budget-lens.restoring.db";

/** What a "start over" renames a kept database to. */
const ORPHAN_PREFIX = "budget-lens.orphan-";

const ORPHAN_SUFFIX = ".db";

/**
 * The side files of a rollback-journal database. expo-sqlite does not enable WAL, so `-journal` is the hot
 * journal SQLite writes inside a transaction; `-wal`/`-shm` are listed too because a database that ever ran in
 * WAL mode can still have them. A side file belongs to the file it is named after, so it is renamed or deleted
 * together with it and never left behind for another file to adopt (#75 R5).
 */
const SIDE_FILE_SUFFIXES = ["-journal", "-wal", "-shm"] as const;

export function sideFileNames(name: string): string[] {
  return SIDE_FILE_SUFFIXES.map((suffix) => `${name}${suffix}`);
}

/** Every name a database occupies: itself first, then its side files. */
export function fileNamesOf(name: string): string[] {
  return [name, ...sideFileNames(name)];
}

export function orphanName(stamp: number): string {
  return `${ORPHAN_PREFIX}${String(stamp)}${ORPHAN_SUFFIX}`;
}

/**
 * A "start over" renames a kept file to `<orphan>`, and a copy or an interrupted restore to
 * `<orphan>.<original name>`, so each keeps its own side files beside it and still says what it was.
 */
function keptName(stamp: number, name: string): string {
  return name === DATABASE_NAME ? orphanName(stamp) : `${orphanName(stamp)}.${name}`;
}

/** Whether a directory entry is one of the files this app owns. */
export function isBudgetFile(name: string): boolean {
  return (
    fileNamesOf(DATABASE_NAME).includes(name) ||
    fileNamesOf(COPY_NAME).includes(name) ||
    fileNamesOf(RESTORE_NAME).includes(name) ||
    name.startsWith(ORPHAN_PREFIX)
  );
}

/**
 * What to rename for a "start over" at the given stamp: the live database with its side files, plus the copy and
 * the interrupted restore that are still being kept, each with its own side files. Everything belonging to the
 * kept budget moves with it, so the names the fresh database is about to take hold nothing of the old one
 * (#75 R5) and the kept files keep what they need to be opened again by E8 (#96/#97).
 */
export function asideNames(options: {
  readonly stamp: number;
  readonly database: boolean;
  readonly copy: boolean;
  readonly restoring: boolean;
}): { readonly from: string; readonly to: string }[] {
  const { stamp, database, copy, restoring } = options;
  const moves: { readonly from: string; readonly to: string }[] = [];
  const kept = [
    database ? DATABASE_NAME : undefined,
    copy ? COPY_NAME : undefined,
    restoring ? RESTORE_NAME : undefined,
  ];
  for (const name of kept) {
    if (name === undefined) {
      continue;
    }
    const destination = keptName(stamp, name);
    for (const [index, from] of fileNamesOf(name).entries()) {
      const to = index === 0 ? destination : `${destination}${SIDE_FILE_SUFFIXES[index - 1]}`;
      moves.push({ from, to });
    }
  }
  return moves;
}
