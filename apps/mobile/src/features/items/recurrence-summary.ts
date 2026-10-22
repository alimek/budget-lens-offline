// The recurrence summary of a list row (#112): what a rule version does, in words. Nothing here is a sentence
// built in code – a part is an i18n key with its options, and `joinSummary` only puts the translated separator
// between translated parts (docs/i18n.md). A part carries a raw `YearMonth` (or a month number) and the
// `monthName` i18next formatter renders it in the case the translation asks for (#63, decision 5).
import {
  addMonths,
  monthsBetween,
  type RuleVersion,
  type Schedule,
  validateSchedule,
  type YearMonth,
} from "@budget-lens/core";

/** The keys a summary is built from; every one of them is a full phrase on its own. */
export type SummaryKey =
  | "summary.monthly"
  | "summary.everyN"
  | "summary.yearly"
  | "summary.oneTime"
  | "summary.onDay"
  | "summary.from"
  | "summary.until"
  | "summary.ended";

/** `summary.separator` is the joining text, never a part. Keys of the `items` namespace. */
export type SummaryTextKey = SummaryKey | "summary.separator";

export interface SummaryPart {
  readonly key: SummaryKey;
  /** i18next options: the interpolation values, with `count` on the plural keys. */
  readonly options: Readonly<Record<string, string | number | boolean>>;
  /** How this part follows the previous one: the separator key, or a plain space ("Every 3 months from Feb 2027"). */
  readonly gap: "separator" | "space";
}

/** The month number of a `YearMonth`, for a key that names the month alone ("Yearly · March"). */
function monthNumber(month: YearMonth): number {
  return Number(month.slice(5, 7));
}

/** The month of the schedule's first occurrence. */
function firstOccurrence(schedule: Schedule): YearMonth {
  return schedule.kind === "one-time" ? schedule.month : schedule.anchor;
}

/**
 * The month of the schedule's last occurrence, or `undefined` when it never ends. Only a recurring schedule
 * with an `endMonth` can end, and its last occurrence is the last anchor step at or before that month.
 */
function lastOccurrence(schedule: Schedule): YearMonth | undefined {
  if (schedule.kind === "one-time") {
    return schedule.month;
  }
  const { anchor, intervalMonths, endMonth } = schedule;
  if (endMonth === undefined) {
    return undefined;
  }
  const steps = Math.floor(monthsBetween(anchor, endMonth) / intervalMonths);
  return steps <= 0 ? anchor : addMonths(anchor, steps * intervalMonths);
}

/** The repeating rhythm: monthly, yearly with its month name, or every N months. */
function cadence(schedule: Schedule): SummaryPart {
  if (schedule.kind === "one-time") {
    return {
      key: "summary.oneTime",
      options: { month: schedule.month },
      gap: "separator",
    };
  }
  const { intervalMonths } = schedule;
  if (intervalMonths === 1) {
    return { key: "summary.monthly", options: {}, gap: "separator" };
  }
  if (intervalMonths === 12) {
    return {
      key: "summary.yearly",
      options: { month: monthNumber(schedule.anchor) },
      gap: "separator",
    };
  }
  return {
    key: "summary.everyN",
    options: { count: intervalMonths },
    gap: "separator",
  };
}

/** The day of the month, an English ordinal ("on the 10th") through i18next's ordinal plural rules. */
const dayPart = (dayOfMonth: number): SummaryPart => ({
  key: "summary.onDay",
  options: { count: dayOfMonth, ordinal: true },
  gap: "separator",
});

/**
 * The summary of one rule version as it looks from `activeMonth`: its rhythm, the day it falls on, the month it
 * starts from when that is still ahead, and the month it runs until.
 *
 * A schedule whose last occurrence is behind the active month says only that it ended, naming that month (#63,
 * decision 6: ended items stay listed with the "Ended" summary until they are archived). A one-time item whose
 * month is now or still ahead names its month, because that month is the whole summary. A schedule core rejects –
 * an archived item whose versions are history and were never validated (#81) – has no summary rather than a
 * wrong one.
 */
export function summarizeVersion(
  version: RuleVersion,
  activeMonth: YearMonth,
): readonly SummaryPart[] {
  const { schedule } = version;
  if (validateSchedule(schedule).length > 0) {
    return [];
  }
  const last = lastOccurrence(schedule);
  if (last !== undefined && monthsBetween(activeMonth, last) < 0) {
    return [{ key: "summary.ended", options: { month: last }, gap: "separator" }];
  }
  const parts: SummaryPart[] = [cadence(schedule)];
  // A one-time item names its month in its own part; only a rhythm can start later on top of being named.
  const starts = firstOccurrence(schedule);
  if (schedule.kind === "recurring" && monthsBetween(activeMonth, starts) > 0) {
    parts.push({
      key: "summary.from",
      options: { month: starts },
      gap: "space",
    });
  }
  const { dayOfMonth } = schedule;
  if (dayOfMonth !== undefined) {
    parts.push(dayPart(dayOfMonth));
  }
  if (schedule.kind === "recurring" && schedule.endMonth !== undefined) {
    parts.push({
      key: "summary.until",
      options: { month: schedule.endMonth },
      gap: "separator",
    });
  }
  return parts;
}

/** The parts as one line: each translated, joined by the translated separator (or a space). */
export function joinSummary(
  parts: readonly SummaryPart[],
  translate: (key: SummaryTextKey, options?: Record<string, string | number | boolean>) => string,
): string {
  return parts
    .map((part, index) => {
      const text = translate(part.key, { ...part.options });
      if (index === 0) {
        return text;
      }
      return part.gap === "space" ? ` ${text}` : translate("summary.separator") + text;
    })
    .join("");
}
