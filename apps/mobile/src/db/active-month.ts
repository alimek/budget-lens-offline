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

/** The month to anchor a screen to: the stored active month, or the calendar month while no month is open. */
export function resolveActiveMonth(stored: YearMonth | undefined, now: Date): YearMonth {
  return stored ?? localCalendarMonth(now);
}
