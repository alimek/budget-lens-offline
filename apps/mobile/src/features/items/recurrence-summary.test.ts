// What the list says about a rule version (#112): its rhythm, the month it starts from, the month it runs until.
import {
  type MinorUnits,
  type RuleVersion,
  type Schedule,
  toYearMonth,
  type YearMonth,
} from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import {
  joinSummary,
  type SummaryPart,
  type SummaryTextKey,
  summarizeVersion,
} from "./recurrence-summary";

const activeMonth = toYearMonth("2026-10");

/** A month, branded: the tests say months the way the domain does. */
const month = (value: string): YearMonth => toYearMonth(value);

const version = (schedule: Schedule, amount = 1000): RuleVersion => ({
  effectiveFrom: month("2026-01"),
  amount: amount as MinorUnits,
  schedule,
});

/** The parts as one line, through the same joining the screen uses, with development words. */
const words: Record<SummaryTextKey, string> = {
  "items.summary.separator": " | ",
  "items.summary.monthly": "Monthly",
  "items.summary.everyN": "Every {{count}} months",
  "items.summary.yearly": "Yearly {{monthName}}",
  "items.summary.oneTime": "One-time {{month}}",
  "items.summary.onDay": "day {{count}}",
  "items.summary.from": "from {{month}}",
  "items.summary.until": "until {{month}}",
  "items.summary.ended": "ended {{month}}",
};

function text(parts: readonly SummaryPart[]): string {
  return joinSummary(parts, (key, options) => {
    let line = words[key];
    for (const [name, value] of Object.entries(options ?? {})) {
      line = line.replace(`{{${name}}}`, String(value));
    }
    return line;
  });
}

describe("summarizeVersion", () => {
  it("names the rhythm and the day of a monthly item", () => {
    // Arrange
    const rule = version({
      kind: "recurring",
      intervalMonths: 1,
      anchor: month("2026-01"),
      dayOfMonth: 10,
    });

    // Act
    const parts = summarizeVersion(rule, activeMonth, "en");

    // Assert
    expect(parts.map((part) => part.key)).toEqual(["items.summary.monthly", "items.summary.onDay"]);
    expect(parts[1]?.options).toEqual({ count: 10, ordinal: true });
  });

  it("counts a longer rhythm", () => {
    // Arrange
    const rule = version({ kind: "recurring", intervalMonths: 3, anchor: month("2026-01") });

    // Act
    const parts = summarizeVersion(rule, activeMonth, "en");

    // Assert
    expect(parts).toHaveLength(1);
    expect(parts[0]?.options).toEqual({ count: 3 });
  });

  it("names the month of a yearly item", () => {
    // Arrange
    const rule = version({ kind: "recurring", intervalMonths: 12, anchor: month("2027-03") });

    // Act
    const parts = summarizeVersion(rule, activeMonth, "en");

    // Assert
    expect(parts[0]?.options).toEqual({ monthName: "March" });
  });

  it("says which month an item that has not started yet begins from", () => {
    // Arrange
    const rule = version({ kind: "recurring", intervalMonths: 3, anchor: month("2027-02") });

    // Act
    const parts = summarizeVersion(rule, activeMonth, "en");

    // Assert
    expect(parts.map((part) => part.key)).toEqual(["items.summary.everyN", "items.summary.from"]);
    expect(parts[1]?.options).toEqual({ month: "Feb 2027" });
    expect(text(parts)).toBe("Every 3 months from Feb 2027");
  });

  it("names the month of a one-time item", () => {
    // Arrange
    const rule = version({ kind: "one-time", month: month("2026-11") });

    // Act
    const parts = summarizeVersion(rule, activeMonth, "en");

    // Assert
    expect(parts).toHaveLength(1);
    expect(parts[0]?.options).toEqual({ month: "Nov 2026" });
  });

  it("says until when a recurring item still runs and ends later", () => {
    // Arrange
    const rule = version({
      kind: "recurring",
      intervalMonths: 1,
      anchor: month("2026-01"),
      endMonth: month("2027-06"),
    });

    // Act
    const parts = summarizeVersion(rule, activeMonth, "en");

    // Assert
    expect(text(parts)).toBe("Monthly | until Jun 2027");
  });

  it("says only that an item whose last occurrence has passed has ended", () => {
    // Arrange: every 3 months from Jan 2026 to Jul 2026, so the last occurrence is Jul, before Oct.
    const rule = version({
      kind: "recurring",
      intervalMonths: 3,
      anchor: month("2026-01"),
      endMonth: month("2026-08"),
    });

    // Act
    const parts = summarizeVersion(rule, activeMonth, "en");

    // Assert
    expect(parts.map((part) => part.key)).toEqual(["items.summary.ended"]);
    expect(parts[0]?.options).toEqual({ month: "Jul 2026" });
  });

  it("keeps the month of a one-time item whose month has passed", () => {
    // Arrange
    const rule = version({ kind: "one-time", month: month("2026-05") });

    // Act
    const parts = summarizeVersion(rule, activeMonth, "en");

    // Assert
    expect(parts.map((part) => part.key)).toEqual(["items.summary.oneTime"]);
  });

  it("summarises a schedule core rejects as nothing", () => {
    // Arrange: an archived item's history can hold a broken schedule (#81 never validates it).
    const rule = version({ kind: "recurring", intervalMonths: 0, anchor: month("2026-01") });

    // Act
    const parts = summarizeVersion(rule, activeMonth, "en");

    // Assert
    expect(parts).toEqual([]);
  });

  it("formats a month as a calendar month, never as an instant", () => {
    // Arrange
    const rule = version({ kind: "one-time", month: month("2027-02") });

    // Act / Assert: the same short month/year form in both languages, none of them moved by a time zone.
    expect(summarizeVersion(rule, activeMonth, "en")[0]?.options["month"]).toBe("Feb 2027");
    expect(summarizeVersion(rule, activeMonth, "pl")[0]?.options["month"]).toContain("2027");
  });
});
