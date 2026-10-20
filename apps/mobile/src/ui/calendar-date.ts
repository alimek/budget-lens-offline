import type { Language } from "@budget-lens/core";

/** A calendar day without a time or time zone, `YYYY-MM-DD` (due dates, months). */
export type CalendarDate = `${number}-${number}-${number}`;

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parts(date: CalendarDate): [number, number, number] {
  const match = CALENDAR_DATE.exec(date);
  if (match === null) throw new RangeError(`Not a calendar date: ${date}`);
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    throw new RangeError(`Not a calendar date: ${date}`);
  }
  return [year, month, day];
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

/** True for a real `YYYY-MM-DD` day (no 31 April). */
export function isCalendarDate(value: string): value is CalendarDate {
  try {
    parts(value as CalendarDate);
    return true;
  } catch {
    return false;
  }
}

/**
 * The day as a device-local `Date` at midnight, for pickers that work in local time (SwiftUI `DatePicker`).
 */
export function calendarDateToLocal(date: CalendarDate): Date {
  const [year, month, day] = parts(date);
  return new Date(year, month - 1, day);
}

/** The local calendar day of a `Date` (SwiftUI `DatePicker` returns the selected day in local time). */
export function localToCalendarDate(date: Date): CalendarDate {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as CalendarDate;
}

/** Milliseconds of the day's UTC midnight, the format of the Material 3 date picker. */
export function calendarDateToUtcMillis(date: CalendarDate): number {
  const [year, month, day] = parts(date);
  return Date.UTC(year, month - 1, day);
}

/** The day of a Material 3 date picker selection (UTC midnight), whatever the device time zone. */
export function utcMillisToCalendarDate(millis: number): CalendarDate {
  const date = new Date(millis);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` as CalendarDate;
}

/** The day for display with `Intl` in the app language, e.g. `10 paź 2026` / `Oct 10, 2026`. */
export function formatCalendarDate(date: CalendarDate, lang: Language): string {
  return new Intl.DateTimeFormat(lang, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(calendarDateToUtcMillis(date));
}
