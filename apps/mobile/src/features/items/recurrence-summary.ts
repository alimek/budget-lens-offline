// The recurrence summary of a list row (#112): what a rule version does, in words. Nothing here is a sentence
// built in code – a part is an i18n key with its options, and `joinSummary` only puts the translated separator
// between translated parts (docs/i18n.md). Month names come from native `Intl` (`month-name.ts`).
import {
  addMonths,
  type Language,
  monthsBetween,
  type RuleVersion,
  type Schedule,
  validateSchedule,
  type YearMonth,
} from "@budget-lens/core";
import { formatMonth, formatMonthName } from "./month-name";

/** The keys a summary is built from; every one of them is a full phrase on its own. */
export type SummaryKey =
  | "items.summary.monthly"
  | "items.summary.everyN"
  | "items.summary.yearly"
  | "items.summary.oneTime"
  | "items.summary.onDay"
  | "items.summary.from"
  | "items.summary.until"
  | "items.summary.ended";

/** `items.summary.separator` is the joining text, never a part. */
export type SummaryTextKey = SummaryKey | "items.summary.separator";

export interface SummaryPart {
  readonly key: SummaryKey;
  /** i18next options: the interpolation values, with `count` on the plural keys. */
  readonly options: Readonly<Record<string, string | number | boolean>>;
  /** How this part follows the previous one: the separator key, or a plain space ("Every 3 months from Feb 2027"). */
  readonly gap: "separator" | "space";
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
function cadence(schedule: Schedule, lang: Language): SummaryPart {
  if (schedule.kind === "one-time") {
    return {
      key: "items.summary.oneTime",
      options: { month: formatMonth(schedule.month, lang) },
      gap: "separator",
    };
  }
  const { intervalMonths } = schedule;
  if (intervalMonths === 1) {
    return { key: "items.summary.monthly", options: {}, gap: "separator" };
  }
  if (intervalMonths === 12) {
    return {
      key: "items.summary.yearly",
      options: { monthName: formatMonthName(schedule.anchor, lang) },
      gap: "separator",
    };
  }
  return {
    key: "items.summary.everyN",
    options: { count: intervalMonths },
    gap: "separator",
  };
}

/** The day of the month, an English ordinal ("on the 10th") through i18next's ordinal plural rules. */
const dayPart = (dayOfMonth: number): SummaryPart => ({
  key: "items.summary.onDay",
  options: { count: dayOfMonth, ordinal: true },
  gap: "separator",
});

/**
 * The summary of one rule version as it looks from `activeMonth`: its rhythm, the day it falls on, the month it
 * starts from when that is still ahead, and the month it runs until.
 *
 * A recurring schedule whose last occurrence is behind the active month says only that it ended (#63: ended
 * items stay listed until they are archived). A one-time item keeps its month instead, because that month is
 * already the whole summary. A schedule core rejects – an archived item whose versions are history and were
 * never validated (#81) – has no summary rather than a wrong one.
 */
export function summarizeVersion(
  version: RuleVersion,
  activeMonth: YearMonth,
  lang: Language,
): readonly SummaryPart[] {
  const { schedule } = version;
  if (validateSchedule(schedule).length > 0) {
    return [];
  }
  const last = lastOccurrence(schedule);
  if (schedule.kind === "recurring" && last !== undefined && monthsBetween(activeMonth, last) < 0) {
    return [
      { key: "items.summary.ended", options: { month: formatMonth(last, lang) }, gap: "separator" },
    ];
  }
  const parts: SummaryPart[] = [cadence(schedule, lang)];
  // A one-time item names its month in its own part; only a rhythm can start later on top of being named.
  const starts = firstOccurrence(schedule);
  if (schedule.kind === "recurring" && monthsBetween(activeMonth, starts) > 0) {
    parts.push({
      key: "items.summary.from",
      options: { month: formatMonth(starts, lang) },
      gap: "space",
    });
  }
  const { dayOfMonth } = schedule;
  if (dayOfMonth !== undefined) {
    parts.push(dayPart(dayOfMonth));
  }
  if (schedule.kind === "recurring" && schedule.endMonth !== undefined) {
    parts.push({
      key: "items.summary.until",
      options: { month: formatMonth(schedule.endMonth, lang) },
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
      return part.gap === "space" ? ` ${text}` : translate("items.summary.separator") + text;
    })
    .join("");
}
