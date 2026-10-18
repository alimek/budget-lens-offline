import { addMonths, daysInMonth, monthsBetween, toYearMonth, type YearMonth } from "./year-month";

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

export type ScheduleErrorCode = "invalid-interval" | "invalid-day-of-month" | "end-before-anchor";

/** Validation for user input; returns error codes for the UI to translate (empty when the schedule is valid). */
export function validateSchedule(schedule: Schedule): ScheduleErrorCode[] {
  const errors: ScheduleErrorCode[] = [];
  if (schedule.kind === "recurring") {
    if (!Number.isSafeInteger(schedule.intervalMonths) || schedule.intervalMonths < 1) {
      errors.push("invalid-interval");
    }
    if (schedule.endMonth !== undefined && monthsBetween(schedule.anchor, schedule.endMonth) < 0) {
      errors.push("end-before-anchor");
    }
  }
  const day = schedule.dayOfMonth;
  if (day !== undefined && (!Number.isInteger(day) || day < 1 || day > 31)) {
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
  if (schedule.dayOfMonth === undefined) {
    return { month };
  }
  return { month, day: Math.min(schedule.dayOfMonth, daysInMonth(month)) };
}

/** Whether the item has an occurrence in `month`. Throws a `RangeError` for an invalid schedule. */
export function isActiveInMonth(schedule: Schedule, month: YearMonth): boolean {
  return occurrencesInRange(schedule, month, month).length > 0;
}

/**
 * Occurrences from `from` to `to` (both inclusive), in month order. Nothing happens before the anchor or after
 * the end month. Throws a `RangeError` for an invalid schedule.
 */
export function occurrencesInRange(
  schedule: Schedule,
  from: YearMonth,
  to: YearMonth,
): Occurrence[] {
  assertValid(schedule);
  if (schedule.kind === "one-time") {
    const inRange =
      monthsBetween(from, schedule.month) >= 0 && monthsBetween(schedule.month, to) >= 0;
    return inRange ? [occurrence(schedule, schedule.month)] : [];
  }

  const { anchor, intervalMonths, endMonth } = schedule;
  const last = endMonth !== undefined && monthsBetween(endMonth, to) > 0 ? endMonth : to;
  // First occurrence index at or after `from` (index 0 is the anchor).
  const firstIndex = Math.max(0, Math.ceil(monthsBetween(anchor, from) / intervalMonths));
  const occurrences: Occurrence[] = [];
  for (
    let month = addMonths(anchor, firstIndex * intervalMonths);
    monthsBetween(month, last) >= 0;
  ) {
    occurrences.push(occurrence(schedule, month));
    month = addMonths(month, intervalMonths);
  }
  return occurrences;
}

/** The fields of a legacy expense or income (`alimek/budget-lens`) that decide when it is active. */
export interface LegacyScheduleFields {
  readonly type: "recurring" | "one-time";
  readonly frequency?: "monthly" | "quarterly" | "yearly";
  /** Month of a yearly expense, 1–12. */
  readonly startMonth?: number;
  /** `YYYY-MM` of a one-time item. */
  readonly targetMonth?: string;
  readonly dayOfMonth?: number;
}

/** First month at or after `from` whose month number (1–12) is in `monthNumbers`. */
function firstMatchingMonth(from: YearMonth, monthNumbers: readonly number[]): YearMonth {
  let month = from;
  while (!monthNumbers.includes(Number(month.slice(5, 7)))) {
    month = addMonths(month, 1);
  }
  return month;
}

/**
 * Maps a legacy item to a {@link Schedule}. Legacy recurring items have no start date, so `startMonth` (for
 * example the month the item was created) becomes the start: the anchor is the first month at or after it that
 * keeps the legacy calendar – any month for monthly items, January/April/July/October for quarterly items, the
 * item's `startMonth` (or January) for yearly items. Returns `null` for a one-time item without `targetMonth`,
 * which legacy never shows.
 */
export function scheduleFromLegacy(
  item: LegacyScheduleFields,
  startMonth: YearMonth,
): Schedule | null {
  const day = item.dayOfMonth === undefined ? {} : { dayOfMonth: item.dayOfMonth };
  if (item.type === "one-time") {
    return item.targetMonth === undefined
      ? null
      : { kind: "one-time", month: toYearMonth(item.targetMonth), ...day };
  }
  switch (item.frequency) {
    case "quarterly":
      return {
        kind: "recurring",
        intervalMonths: 3,
        anchor: firstMatchingMonth(startMonth, [1, 4, 7, 10]),
        ...day,
      };
    case "yearly":
      return {
        kind: "recurring",
        intervalMonths: 12,
        anchor: firstMatchingMonth(startMonth, [item.startMonth ?? 1]),
        ...day,
      };
    default:
      // "monthly" and recurring items without a frequency (legacy treats both as monthly).
      return { kind: "recurring", intervalMonths: 1, anchor: startMonth, ...day };
  }
}
