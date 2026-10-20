import { type ReactNode, useEffect, useState } from "react";
import { openAppDatabase } from "./database";

type GateState =
  | { readonly status: "opening" | "ready" }
  | { readonly status: "failed"; readonly error: unknown };

/**
 * Renders its children only after the database is open and migrated, so no screen reads a stale schema. A failure
 * is rethrown to the root error boundary; the recovery screens are #60/#75.
 */
export function DatabaseGate({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<GateState>({ status: "opening" });
  useEffect(() => {
    openAppDatabase().then(
      () => setState({ status: "ready" }),
      (error: unknown) => setState({ status: "failed", error }),
    );
  }, []);
  if (state.status === "failed") {
    throw state.error;
  }
  return state.status === "ready" ? children : null;
}
