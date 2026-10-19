import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  addMonths,
  daysInMonth,
  MAX_INTERVAL_MONTHS,
  monthsBetween,
  occurrencesInRange,
  type RecurringSchedule,
  toYearMonth,
  type YearMonth,
} from "./index";

/** A recurring schedule that always has a day of month – what the arbitrary below generates. */
interface ScheduledItem extends RecurringSchedule {
  readonly dayOfMonth: number;
}

// A month of the realistic budget window 2000-01 to 2100-12: an end month or range still stays far inside the
// supported domain of 0000-01 to 9999-12.
const FIRST_MONTH = toYearMonth("2000-01");
const month = fc.integer({ min: 0, max: 1200 }).map((offset) => addMonths(FIRST_MONTH, offset));

// Days 28–31: the ones that can fall outside a shorter month and have to be clamped.
const scheduledItem: fc.Arbitrary<ScheduledItem> = fc
  .record({
    anchor: month,
    intervalMonths: fc.integer({ min: 1, max: MAX_INTERVAL_MONTHS }),
    dayOfMonth: fc.integer({ min: 28, max: 31 }),
    endOffset: fc.option(fc.integer({ min: 0, max: 480 }), { nil: undefined }),
  })
  .map(({ anchor, intervalMonths, dayOfMonth, endOffset }) => ({
    kind: "recurring" as const,
    anchor,
    intervalMonths,
    dayOfMonth,
    ...(endOffset === undefined ? {} : { endMonth: addMonths(anchor, endOffset) }),
  }));

// The range the app asks about, independent of the schedule: it can start before the anchor or after the end.
const range = fc.record({ from: month, months: fc.integer({ min: 0, max: 240 }) });

describe("occurrencesInRange (properties)", () => {
  it("schedules nothing outside the requested range, before the anchor or after the end month", () => {
    // Arrange
    const property = fc.property(scheduledItem, range, (item, { from, months }) => {
      const to = addMonths(from, months);
      // Without an end month the last possible month is the end of the range, which is asserted anyway.
      const lastMonth = item.endMonth ?? to;

      // Act
      const occurrences = occurrencesInRange(item, from, to);

      // Assert
      for (const occurrence of occurrences) {
        expect(monthsBetween(from, occurrence.month)).toBeGreaterThanOrEqual(0);
        expect(monthsBetween(occurrence.month, to)).toBeGreaterThanOrEqual(0);
        expect(monthsBetween(item.anchor, occurrence.month)).toBeGreaterThanOrEqual(0);
        expect(monthsBetween(occurrence.month, lastMonth)).toBeGreaterThanOrEqual(0);
      }
    });

    fc.assert(property);
  });

  it("schedules the item every intervalMonths from its anchor, with no gaps and no duplicates", () => {
    // Arrange: the months the user would list by hand, checking every month of the range against the rule.
    const property = fc.property(scheduledItem, range, (item, { from, months }) => {
      const to = addMonths(from, months);
      const expected: YearMonth[] = [];
      for (let offset = 0; offset <= months; offset++) {
        const candidate = addMonths(from, offset);
        const sinceAnchor = monthsBetween(item.anchor, candidate);
        const recurs =
          sinceAnchor >= 0 &&
          sinceAnchor % item.intervalMonths === 0 &&
          (item.endMonth === undefined || monthsBetween(candidate, item.endMonth) >= 0);
        if (recurs) {
          expected.push(candidate);
        }
      }

      // Act
      const occurrences = occurrencesInRange(item, from, to);

      // Assert
      expect(occurrences.map((occurrence) => occurrence.month)).toEqual(expected);
    });

    fc.assert(property);
  });

  it("clamps the day of month to the last day of every month it schedules", () => {
    // Arrange
    const property = fc.property(scheduledItem, range, (item, { from, months }) => {
      // Act
      const occurrences = occurrencesInRange(item, from, addMonths(from, months));

      // Assert: every generated item has a day of month, so an occurrence without a day fails this check too.
      for (const occurrence of occurrences) {
        expect(occurrence.day).toBe(Math.min(item.dayOfMonth, daysInMonth(occurrence.month)));
      }
    });

    fc.assert(property);
  });
});
