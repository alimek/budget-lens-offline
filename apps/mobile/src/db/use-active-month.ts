// The active month as app state (#112): the `months` row with `status = 'active'` when there is one, and until
// onboarding (#111) opens the first month, the device's own calendar month. Screens anchor recurrence summaries
// and scheduled changes to this month, so they all agree on what "now" means for the budget.
import type { YearMonth } from "@budget-lens/core";
import { MONTH_TABLES, readActiveMonth } from "@budget-lens/db";
import { resolveActiveMonth } from "./active-month";
import { useLiveRead } from "./use-live-read";

/**
 * The month the app treats as active. `clock` is injected like `AppStoreProvider`'s; while `months` has no active
 * row – before onboarding (#111) exists, and while the first read is still pending – it is the calendar month of
 * that clock, never a value the repository invented.
 */
export function useActiveMonth(clock: () => Date = () => new Date()): YearMonth {
  const stored = useLiveRead(MONTH_TABLES, readActiveMonth);
  return resolveActiveMonth(stored.status === "ready" ? stored.value : undefined, clock());
}
