import { type ReactNode, useCallback, useEffect, useState } from "react";
import { RecoveryScreen } from "./boot-screens";
import { bootAppDatabase, type DatabaseBoot, startOverAppDatabase } from "./database";
import { DatabaseProvider } from "./database-provider";

type GateState = DatabaseBoot | { readonly kind: "opening" };

/**
 * Shows the app only once the database is open and its schema is migrated, so no screen reads a stale or
 * half-migrated database (#74, #242), and hands the ready connection to those screens through `DatabaseProvider`
 * (#112), which is where `useDatabase()` and the live reads take it from.
 *
 * While the database stays closed, the recovery screen of #60 stands in for the app: it offers a retry and a
 * "start over" behind a confirmation, which keeps the file. No path here deletes data.
 */
export function DatabaseGate({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<GateState>({ kind: "opening" });
  const start = useCallback((open: () => Promise<DatabaseBoot>) => {
    setState({ kind: "opening" });
    void open().then(setState);
  }, []);
  useEffect(() => {
    start(bootAppDatabase);
  }, [start]);

  if (state.kind === "ready") {
    return <DatabaseProvider db={state.db}>{children}</DatabaseProvider>;
  }
  if (state.kind === "opening") {
    return null;
  }
  return (
    <RecoveryScreen
      onRetry={() => start(bootAppDatabase)}
      onStartOver={() => start(startOverAppDatabase)}
    />
  );
}
