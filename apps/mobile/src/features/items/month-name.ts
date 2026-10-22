// Month names for the recurring-item copy (#112), formatted with native `Intl` like every other date in the app
// (ADR 0012). A `YearMonth` is a calendar month, not an instant: it is formatted as the first day of that month in
// UTC, so no device time zone can move a month boundary.
import type { Language, YearMonth } from "@budget-lens/core";

/** The `Intl` locale of an app language, the same mapping `formatMoney` uses. */
const locale = (lang: Language): string => (lang === "pl" ? "pl-PL" : "en-GB");

/** The month as UTC midnight of its first day: `Intl` reads a month, never an instant. */
function monthInstant(month: YearMonth): number {
  const [year, number] = month.split("-").map(Number) as [number, number];
  return Date.UTC(year, number - 1, 1);
}

/** A month for the list and the badges: "Feb 2027" / "lut 2027". */
export function formatMonth(month: YearMonth, lang: Language): string {
  return new Intl.DateTimeFormat(locale(lang), {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthInstant(month));
}

/** A month name on its own: "March" / "marzec" (nominative, as in "Yearly · March"). */
export function formatMonthName(month: YearMonth, lang: Language): string {
  return new Intl.DateTimeFormat(locale(lang), {
    month: "long",
    timeZone: "UTC",
  }).format(monthInstant(month));
}
