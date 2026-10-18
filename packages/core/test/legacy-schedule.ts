/**
 * Test-only helper: maps a legacy fixture item to a ported `Schedule`, so the characterization tests can compare
 * the ported recurrence rules with legacy. There is no legacy data import in the app.
 *
 * Legacy recurring items have no start date, so `from` becomes the start: the anchor is the first month at or after
 * `from` that keeps the legacy calendar – any month for monthly items, January/April/July/October for quarterly
 * items, the item's `startMonth` (or January) for yearly items. One-time items without `targetMonth` give `null`
 * (legacy never shows them).
 */
import { addMonths, type Schedule, toYearMonth, type YearMonth } from "../src/index";
import type { LegacyExpense, LegacyIncome } from "./legacy/types";

/** The first month at or after `from` whose month number is `target` + k × `period` (period 3 or 12). */
function firstMonthInPhase(from: YearMonth, target: number, period: number): YearMonth {
  const offset = (((target - Number(from.slice(5, 7))) % period) + period) % period;
  return addMonths(from, offset);
}

export function legacySchedule(
  item: LegacyExpense | LegacyIncome,
  from: YearMonth,
): Schedule | null {
  if (item.type === "one-time") {
    return item.targetMonth === undefined
      ? null
      : { kind: "one-time", month: toYearMonth(item.targetMonth) };
  }
  if (item.frequency === "quarterly") {
    return { kind: "recurring", intervalMonths: 3, anchor: firstMonthInPhase(from, 1, 3) };
  }
  if (item.frequency === "yearly") {
    const startMonth = "startMonth" in item ? (item.startMonth ?? 1) : 1;
    return {
      kind: "recurring",
      intervalMonths: 12,
      anchor: firstMonthInPhase(from, startMonth, 12),
    };
  }
  // "monthly" and recurring items without a frequency (legacy treats both as monthly).
  return { kind: "recurring", intervalMonths: 1, anchor: from };
}
