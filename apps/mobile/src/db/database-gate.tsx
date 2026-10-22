import type { BudgetDatabase } from "@budget-lens/db";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { type BootAction, type BootOutcome, type BootReason, BootScreen } from "./boot-screens";
import { bootAppDatabase, type DatabaseBoot, startOverAppDatabase } from "./database";
import { DatabaseProvider } from "./database-provider";

/** What the gate is showing while the database stays closed. */
interface GateState {
  /** The screen the last attempt asks for, or `null` before the first one has come back. */
  readonly screen: BootReason | null;
  /** What the user asked for and the app is still doing, if anything. */
  readonly pending: BootAction | null;
  /** What the attempt that came back has left to say. */
  readonly outcome: BootOutcome | null;
}

const IDLE: GateState = { screen: null, pending: null, outcome: null };

/**
 * Shows the app only once the encrypted database is open and its schema is migrated, so no screen reads a stale
 * or unkeyed database (#74, #75), and hands the ready connection to those screens through `DatabaseProvider`
 * (#112), which is where `useDatabase()` and the live reads take it from.
 *
 * While the database stays closed, a boot screen of #60 stands in for the app: a build without SQLCipher stops, a
 * budget whose key is gone explains itself, and anything the device refused to answer offers a retry. No path
 * here deletes data.
 *
 * Asking for another attempt never blanks that screen (#217 R4): the screen stays mounted with its buttons
 * disabled and a status line, and what comes back either replaces it, keeps it with "that didn't work", or – for
 * a start over that secure storage would not allow – keeps it with the reason why. Only the very first open,
 * before any attempt has come back, renders nothing.
 */
export function DatabaseGate({ children }: { readonly children: ReactNode }) {
  const [db, setDb] = useState<BudgetDatabase | null>(null);
  const [state, setState] = useState<GateState>(IDLE);
  // One attempt at a time: a second tap on "Try again" or "Start over" while one is running does nothing (#217 R4).
  const running = useRef(false);

  const apply = useCallback((result: DatabaseBoot) => {
    if (result.kind === "ready") {
      setDb(result.db);
      return;
    }
    // A start over that secure storage refused is not a new screen: it is the reason on the one already shown.
    const asked = result.kind === "start_over_blocked" ? "start_over_blocked" : result.kind;
    setState((previous) => {
      if (asked === "start_over_blocked") {
        return { ...previous, pending: null, outcome: "start_over_blocked" };
      }
      // The same screen again means the attempt did not work; a different one says what the device says now.
      return asked === previous.screen
        ? { ...previous, pending: null, outcome: "failed" }
        : { screen: asked, pending: null, outcome: null };
    });
  }, []);

  const start = useCallback(
    (open: () => Promise<DatabaseBoot>, action: BootAction) => {
      if (running.current) {
        return;
      }
      running.current = true;
      setState((previous) => ({ ...previous, pending: action, outcome: null }));
      void open().then(
        (result) => {
          running.current = false;
          apply(result);
        },
        () => {
          running.current = false;
          setState((previous) => ({ ...previous, pending: null, outcome: "failed" }));
        },
      );
    },
    [apply],
  );

  useEffect(() => {
    start(bootAppDatabase, "retry");
  }, [start]);

  if (db !== null) {
    return <DatabaseProvider db={db}>{children}</DatabaseProvider>;
  }
  if (state.screen === null) {
    return null;
  }
  return (
    <BootScreen
      reason={state.screen}
      pending={state.pending}
      outcome={state.outcome}
      onRetry={() => start(bootAppDatabase, "retry")}
      onStartOver={() => start(startOverAppDatabase, "start_over")}
    />
  );
}
