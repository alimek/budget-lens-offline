import { addMonths, daysInMonth, isYearMonth, monthsBetween, type YearMonth } from "./year-month";

/** An item that happens once, in `month`. */
export interface OneTimeSchedule {
  readonly kind: "one-time";
  readonly month: YearMonth;
  /** Day of the payment, 1–31; clamped to the last day of the month. */
  readonly dayOfMonth?: number;
}

/**
 * An item that repeats every `intervalMonths` months, starting in `anchor` (its first occurrence) and ending,
 * when set, in `endMonth` (inclusive). The same rule is used for expenses and incomes.
 */
export interface RecurringSchedule {
  readonly kind: "recurring";
  readonly intervalMonths: number;
  readonly anchor: YearMonth;
  /** Day of the payment, 1–31; clamped to the last day of each month (31 → 30, 28 or 29). */
  readonly dayOfMonth?: number;
  readonly endMonth?: YearMonth;
}

export type Schedule = OneTimeSchedule | RecurringSchedule;

/** One month's instance of a scheduled item; `day` is present only when the schedule has a `dayOfMonth`. */
export interface Occurrence {
  readonly month: YearMonth;
  readonly day?: number;
}

/** Upper bound of `intervalMonths` (10 years), the same limit as the forecast horizon. */
export const MAX_INTERVAL_MONTHS = 120;

export type ScheduleErrorCode =
  | "invalid-kind"
  | "invalid-month"
  | "invalid-anchor"
  | "invalid-end-month"
  | "invalid-interval"
  | "invalid-day-of-month"
  | "end-before-anchor";

/** Schedule fields as they may come from storage: the static types are not trusted at runtime. */
type UntrustedSchedule = {
  readonly [Field in keyof RecurringSchedule | keyof OneTimeSchedule]?: unknown;
};

/** `null` (a nullable SQLite column) counts as an absent optional field. */
function isAbsent(value: unknown): value is null | undefined {
  return value === undefined || value === null;
}

const isMonth = (value: unknown): value is YearMonth =>
  typeof value === "string" && isYearMonth(value);

function isInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

function recurringErrors(schedule: UntrustedSchedule): ScheduleErrorCode[] {
  const { intervalMonths, anchor, endMonth } = schedule;
  const errors: ScheduleErrorCode[] = [];
  if (!isInteger(intervalMonths, 1, MAX_INTERVAL_MONTHS)) {
    errors.push("invalid-interval");
  }
  if (!isMonth(anchor)) {
    errors.push("invalid-anchor");
  }
  if (!isAbsent(endMonth) && !isMonth(endMonth)) {
    errors.push("invalid-end-month");
  } else if (isMonth(anchor) && isMonth(endMonth) && monthsBetween(anchor, endMonth) < 0) {
    errors.push("end-before-anchor");
  }
  return errors;
}

/**
 * Validates a schedule, including one loaded from storage: every field is checked at runtime and a wrong type is
 * an error code, never a thrown `TypeError`. `null` optional fields count as absent. Returns error codes for the
 * UI to translate (empty when the schedule is valid).
 */
export function validateSchedule(schedule: Schedule): ScheduleErrorCode[] {
  if (typeof schedule !== "object" || schedule === null) {
    return ["invalid-kind"];
  }
  const untrusted: UntrustedSchedule = schedule;
  if (untrusted.kind !== "recurring" && untrusted.kind !== "one-time") {
    return ["invalid-kind"];
  }
  const errors =
    untrusted.kind === "recurring"
      ? recurringErrors(untrusted)
      : isMonth(untrusted.month)
        ? []
        : (["invalid-month"] as ScheduleErrorCode[]);
  if (!isAbsent(untrusted.dayOfMonth) && !isInteger(untrusted.dayOfMonth, 1, 31)) {
    errors.push("invalid-day-of-month");
  }
  return errors;
}

function assertValid(schedule: Schedule): void {
  const errors = validateSchedule(schedule);
  if (errors.length > 0) {
    throw new RangeError(`Invalid schedule: ${errors.join(", ")}`);
  }
}

function occurrence(schedule: Schedule, month: YearMonth): Occurrence {
  const day = schedule.dayOfMonth;
  return isAbsent(day) ? { month } : { month, day: Math.min(day, daysInMonth(month)) };
}

/** Whether the item has an occurrence in `month`. Throws a `RangeError` for an invalid schedule. */
export function isActiveInMonth(schedule: Schedule, month: YearMonth): boolean {
  return occurrencesInRange(schedule, month, month).length > 0;
}

/**
 * Occurrences from `from` to `to` (both inclusive), in month order. Nothing happens before the anchor or after
 * the end month. The first and last occurrence in the range are computed arithmetically, so only the returned
 * months are built. Throws a `RangeError` for an invalid schedule.
 */
export function occurrencesInRange(
  schedule: Schedule,
  from: YearMonth,
  to: YearMonth,
): readonly Occurrence[] {
  assertValid(schedule);
  if (schedule.kind === "one-time") {
    const inRange =
      monthsBetween(from, schedule.month) >= 0 && monthsBetween(schedule.month, to) >= 0;
    return inRange ? [occurrence(schedule, schedule.month)] : [];
  }

  const { anchor, intervalMonths, endMonth } = schedule;
  const last = !isAbsent(endMonth) && monthsBetween(endMonth, to) > 0 ? endMonth : to;
  // Occurrence indexes (index 0 is the anchor) of the first occurrence at or after `from` and the last one at or
  // before `last`.
  const firstIndex = Math.max(0, Math.ceil(monthsBetween(anchor, from) / intervalMonths));
  const lastIndex = Math.floor(monthsBetween(anchor, last) / intervalMonths);
  const occurrences: Occurrence[] = [];
  for (let index = firstIndex; index <= lastIndex; index++) {
    occurrences.push(occurrence(schedule, addMonths(anchor, index * intervalMonths)));
  }
  return occurrences;
}
