// The month the items list anchors to (#112), as pure functions: the `months` table decides it once a month has
// been opened, and until then the device's calendar month stands in. `AppStoreProvider` injects its clock the same
// way, which is also what keeps this testable without touching a real date.
import { toYearMonth, type YearMonth } from "@budget-lens/core";

/**
 * The calendar month a `Date` falls in, read as the device's *local* date: a month is not an instant, and a
 * UTC-based read would move the month for a user near midnight (#38).
 */
export function localCalendarMonth(now: Date): YearMonth {
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return toYearMonth(`${year}-${month}`);
}

/**
 * The read of the stored active month, as the live read reports it: `loading` until it has run, and `error` when
 * it failed. `value` is the `months` row with `status = 'active'`, absent when the table has none.
 */
export interface MonthRead {
  readonly status: "loading" | "ready" | "error";
  readonly value: YearMonth | undefined;
}

/**
 * The month to anchor a screen to, or `undefined` when there is no month to anchor to yet.
 *
 * Only a *ready* read with no active row falls back to the calendar month: that is the documented state before
 * onboarding (#111) opens the first month. A read that is still pending says nothing about the table, and a
 * failed one is a problem the screen has to show, so neither invents a month (#38: the active month comes from
 * the `months` table, never from the clock).
 */
export function resolveActiveMonth(read: MonthRead, now: Date): YearMonth | undefined {
  if (read.status !== "ready") {
    return undefined;
  }
  return read.value ?? localCalendarMonth(now);
}
