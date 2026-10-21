import { type ReactNode, useCallback, useEffect, useState } from "react";
import { BootScreen } from "./boot-screens";
import { bootAppDatabase, type DatabaseBoot, startOverAppDatabase } from "./database";

type GateState = DatabaseBoot | { readonly kind: "opening" };

/**
 * Shows the app only once the encrypted database is open and its schema is migrated, so no screen reads a stale
 * or unkeyed database (#74, #75).
 *
 * While the database stays closed, a boot screen of #60 stands in for the app: a build without SQLCipher stops, a
 * budget whose key is gone offers only "start over" (which keeps the old file), and anything the device refused to
 * answer offers a retry. No path here deletes data.
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
    return children;
  }
  return (
    <BootScreen
      state={state}
      onRetry={() => start(bootAppDatabase)}
      onStartOver={() => start(startOverAppDatabase)}
    />
  );
}
