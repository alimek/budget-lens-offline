// The stored settings as app state (#112): the base currency the items list compares an item's currency with,
// read live so a change written elsewhere lands without a refresh (#78 contributes the repository).
import type { Settings } from "@budget-lens/core";
import { readSettings, SETTINGS_TABLES } from "@budget-lens/db";
import { type LiveReadResult, useLiveRead } from "./use-live-read";

/**
 * The `settings` singleton and its live read. A database with no `settings` row – a fresh install – reads as
 * `DEFAULT_SETTINGS`, whose `baseCurrency` is PLN (#78), so the list always has a base currency to compare with.
 */
export function useSettings(): LiveReadResult<Settings> {
  return useLiveRead(SETTINGS_TABLES, readSettings);
}
