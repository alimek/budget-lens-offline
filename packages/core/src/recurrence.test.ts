import { describe, expect, it } from "vitest";
import {
  isActiveInMonth,
  occurrencesInRange,
  type Schedule,
  toYearMonth,
  validateSchedule,
} from "./index";

const ym = toYearMonth;

const monthsOf = (schedule: Schedule, from: string, to: string): string[] =>
  occurrencesInRange(schedule, ym(from), ym(to)).map((occurrence) => occurrence.month);

describe("occurrencesInRange", () => {
  it.each([
    [1, ["2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06"]],
    [2, ["2026-11", "2027-01", "2027-03", "2027-05"]],
    [3, ["2026-11", "2027-02", "2027-05"]],
    [6, ["2026-11", "2027-05"]],
    [12, ["2026-11"]],
  ])(
    "repeats every %i month(s) from the anchor month, across the year boundary",
    (intervalMonths, expected) => {
      // Arrange
      const schedule: Schedule = { kind: "recurring", intervalMonths, anchor: ym("2026-11") };

      // Act
      const months = monthsOf(schedule, "2026-08", "2027-06");

      // Assert
      expect(months).toEqual(expected);
    },
  );

  it("keeps the anchor's rhythm when the range starts years later", () => {
    // Arrange
    const quarterlyFromFebruary: Schedule = {
      kind: "recurring",
      intervalMonths: 3,
      anchor: ym("2024-02"),
    };

    // Act
    const months = monthsOf(quarterlyFromFebruary, "2026-01", "2026-12");

    // Assert
    expect(months).toEqual(["2026-02", "2026-05", "2026-08", "2026-11"]);
  });

  it("stops after the end month, which is still included", () => {
    // Arrange
    const schedule: Schedule = {
      kind: "recurring",
      intervalMonths: 1,
      anchor: ym("2026-01"),
      endMonth: ym("2026-03"),
    };

    // Act
    const months = monthsOf(schedule, "2025-12", "2026-06");
    const activeAfterEnd = isActiveInMonth(schedule, ym("2026-04"));

    // Assert
    expect(months).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(activeAfterEnd).toBe(false);
  });

  it.each([
    [29, 28, 29],
    [30, 28, 29],
    [31, 28, 29],
  ])(
    "clamps day %i to the last day of February (%i in 2027, %i in leap 2028)",
    (dayOfMonth, day2027, day2028) => {
      // Arrange
      const yearlyInFebruary: Schedule = {
        kind: "recurring",
        intervalMonths: 12,
        anchor: ym("2027-02"),
        dayOfMonth,
      };

      // Act
      const occurrences = occurrencesInRange(yearlyInFebruary, ym("2027-01"), ym("2028-12"));

      // Assert
      expect(occurrences).toEqual([
        { month: "2027-02", day: day2027 },
        { month: "2028-02", day: day2028 },
      ]);
    },
  );

  it("schedules a one-time item only in its month", () => {
    // Arrange
    const oneTime: Schedule = { kind: "one-time", month: ym("2027-07") };

    // Act
    const months = monthsOf(oneTime, "2027-01", "2027-12");
    const activeInJune = isActiveInMonth(oneTime, ym("2027-06"));

    // Assert
    expect(months).toEqual(["2027-07"]);
    expect(activeInJune).toBe(false);
  });
});

describe("validateSchedule", () => {
  it("reports a non-positive interval, an impossible day and an end before the anchor", () => {
    // Arrange
    const invalid: Schedule = {
      kind: "recurring",
      intervalMonths: 0,
      anchor: ym("2026-05"),
      dayOfMonth: 32,
      endMonth: ym("2026-04"),
    };

    // Act
    const errors = validateSchedule(invalid);

    // Assert
    expect(errors).toEqual(["invalid-interval", "end-before-anchor", "invalid-day-of-month"]);
    expect(() => occurrencesInRange(invalid, ym("2026-01"), ym("2026-12"))).toThrow(RangeError);
  });
});
