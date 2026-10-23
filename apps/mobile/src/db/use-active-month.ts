// The active month as app state (#112): the `months` row with `status = 'active'` when there is one, and until
// onboarding (#111) opens the first month, the device's own calendar month. Screens anchor recurrence summaries
// and scheduled changes to this month, so they all agree on what "now" means for the budget.
import type { YearMonth } from "@budget-lens/core";
import { MONTH_TABLES, readActiveMonth } from "@budget-lens/db";
import { resolveActiveMonth } from "./active-month";
import { useLiveRead } from "./use-live-read";

/** The month screens anchor to, with the state of the read it comes from. */
export interface ActiveMonth {
  /**
   * The active month, or `undefined` while the `months` read is pending or failed: until it lands the app has no
   * month to anchor to, and a screen shows its loading or error state instead of rows anchored to a made-up month.
   */
  readonly month: YearMonth | undefined;
  /**
   * The `months` row with `status = 'active'` alone, with no calendar fallback: what a write may be planned
   * against. A screen shows `month` and plans against `stored` (#82), so the fallback above stays display-only.
   */
  readonly stored: YearMonth | undefined;
  readonly status: "loading" | "ready" | "error";
  /** Runs the read again – the retry of the error state. */
  readonly reload: () => void;
}

/**
 * The month the app treats as active. `clock` is injected like `AppStoreProvider`'s; when the `months` table has
 * no active row – the state before onboarding (#111) exists – it is the calendar month of that clock.
 *
 * That fallback is display-only: writes must plan against the stored active month, so #82 must not call
 * `planRuleEdit` with a month derived from the clock.
 */
export function useActiveMonth(clock: () => Date = () => new Date()): ActiveMonth {
  const stored = useLiveRead(MONTH_TABLES, readActiveMonth);
  return {
    month: resolveActiveMonth(stored, clock()),
    stored: stored.value,
    status: stored.status,
    reload: stored.reload,
  };
}
