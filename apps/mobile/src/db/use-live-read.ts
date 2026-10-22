// Live reads (#35 §4): a screen declares the tables a repository read touches, and the read runs again when one of
// them changes. `openEncryptedDatabase` opens the connection with `enableChangeListener`, so every write reports
// its table through `addDatabaseChangeListener`; a repository read is a synchronous pair of single-table selects
// (packages/db/README.md), so re-running it is cheaper than tracking what changed. A write through a repository
// therefore needs no refresh callback: the list sees it on its own.
import type { BudgetDatabase } from "@budget-lens/db";
import { addDatabaseChangeListener } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDatabase } from "./database-provider";

/** The state of a live read: the first one is pending, and a failing retry keeps the last good value. */
export type LiveRead<T> =
  | { readonly status: "loading"; readonly value: undefined }
  | { readonly status: "ready"; readonly value: T }
  | { readonly status: "error"; readonly value: T | undefined };

export type LiveReadResult<T> = LiveRead<T> & {
  /** Runs the read again – the retry of the error state. */
  readonly reload: () => void;
};

/**
 * Re-runs `read(db)` on mount, whenever one of `tables` changes, and whenever `reload` is called.
 *
 * `read` is read through a reference, so callers pass an inline closure without re-subscribing. Reads that throw
 * keep the last good value and report the error, so a failing retry never empties a screen the user is looking at.
 */
export function useLiveRead<T>(
  tables: readonly string[],
  read: (db: BudgetDatabase) => T,
): LiveReadResult<T> {
  const db = useDatabase();
  const readRef = useRef(read);
  readRef.current = read;
  const [state, setState] = useState<LiveRead<T>>({ status: "loading", value: undefined });

  const run = useCallback(() => {
    try {
      setState({ status: "ready", value: readRef.current(db) });
    } catch {
      setState((previous) => ({ status: "error", value: previous.value }));
    }
  }, [db]);

  // The table list arrives as a module constant; the joined names are its identity for this subscription.
  const watched = tables.join(",");
  useEffect(() => {
    run();
    const wanted = watched.split(",");
    const subscription = addDatabaseChangeListener((event) => {
      if (wanted.includes(event.tableName)) {
        run();
      }
    });
    return () => subscription.remove();
  }, [run, watched]);

  return { ...state, reload: run };
}
