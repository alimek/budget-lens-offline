import {
  addMonths,
  daysInMonth,
  isYearMonth,
  monthsBetween,
  toYearMonth,
  type YearMonth,
} from "./year-month";

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

/**
 * The fields of a legacy expense or income (`alimek/budget-lens`) that decide when it is active. Legacy rows may
 * hold `null` or out-of-range values; {@link scheduleFromLegacy} treats them the way legacy does.
 */
export interface LegacyScheduleFields {
  readonly type: "recurring" | "one-time";
  readonly frequency?: "monthly" | "quarterly" | "yearly" | null;
  /** Month of a yearly expense, 1–12. */
  readonly startMonth?: number | null;
  /** `YYYY-MM` of a one-time item. */
  readonly targetMonth?: string | null;
  readonly dayOfMonth?: number | null;
}

/** Month number 1–12 of `month`. */
const monthNumber = (month: YearMonth): number => Number(month.slice(5, 7));

/**
 * Legacy yearly month (1–12) as legacy reads it: a missing field is January, a value is coerced like legacy
 * `startMonth - 1`. `null` for anything that is never a calendar month (`null`, 0, 13, `"abc"`), so the item is
 * never active, as in legacy.
 */
function legacyYearlyMonth(startMonth: unknown): number | null {
  if (startMonth === undefined) {
    return 1;
  }
  const value =
    typeof startMonth === "number" || typeof startMonth === "string"
      ? Number(startMonth)
      : Number.NaN;
  return isInteger(value, 1, 12) ? value : null;
}

/** Legacy one-time month: legacy compares the first two `-`-separated numbers of `targetMonth`; `null` if never. */
function legacyTargetMonth(targetMonth: unknown): YearMonth | null {
  if (typeof targetMonth !== "string" || targetMonth === "") {
    return null;
  }
  const [year, month] = targetMonth.split("-").map(Number);
  return isInteger(year, 0, 9999) && isInteger(month, 1, 12)
    ? toYearMonth(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`)
    : null;
}

/** The first month at or after `from` whose month number is `target` + k × `period` (period 3 or 12). */
function firstMonthInPhase(from: YearMonth, target: number, period: number): YearMonth {
  const offset = (((target - monthNumber(from)) % period) + period) % period;
  return addMonths(from, offset);
}

/**
 * Maps a legacy item to a {@link Schedule}. Legacy recurring items have no start date, so `from` (for example the
 * month the item was created) becomes the start: the anchor is the first month at or after `from` that keeps the
 * legacy calendar – any month for monthly items, January/April/July/October for quarterly items, the item's
 * `startMonth` field (or January when it is missing) for yearly items.
 *
 * Returns `null` for items legacy never shows: a one-time item without a valid `targetMonth`, and a yearly item whose
 * `startMonth` is not a month 1–12 (including `null`). A legacy `dayOfMonth` that is not 1–31 (legacy never uses
 * it) is dropped.
 */
export function scheduleFromLegacy(item: LegacyScheduleFields, from: YearMonth): Schedule | null {
  const dayOfMonth: unknown = item.dayOfMonth;
  const day = isInteger(dayOfMonth, 1, 31) ? { dayOfMonth } : {};
  if (item.type === "one-time") {
    const month = legacyTargetMonth(item.targetMonth);
    return month === null ? null : { kind: "one-time", month, ...day };
  }
  switch (item.frequency) {
    case "quarterly":
      return {
        kind: "recurring",
        intervalMonths: 3,
        anchor: firstMonthInPhase(from, 1, 3),
        ...day,
      };
    case "yearly": {
      const yearlyMonth = legacyYearlyMonth(item.startMonth);
      return yearlyMonth === null
        ? null
        : {
            kind: "recurring",
            intervalMonths: 12,
            anchor: firstMonthInPhase(from, yearlyMonth, 12),
            ...day,
          };
    }
    default:
      // "monthly" and recurring items without a frequency (legacy treats both as monthly).
      return { kind: "recurring", intervalMonths: 1, anchor: from, ...day };
  }
}
