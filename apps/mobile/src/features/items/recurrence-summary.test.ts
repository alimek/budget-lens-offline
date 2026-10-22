// What the list says about a rule version (#112): its rhythm, the month it starts from, the month it runs until,
// rendered through the real `items` resources in both languages, so the summaries are what a user actually reads.
import {
  type Language,
  type MinorUnits,
  type RuleVersion,
  type Schedule,
  toYearMonth,
  type YearMonth,
} from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import { createI18n } from "../../i18n/create-i18n";
import { joinSummary, summarizeVersion } from "./recurrence-summary";

const activeMonth = toYearMonth("2026-10");

/** A month, branded: the tests say months the way the domain does. */
const month = (value: string): YearMonth => toYearMonth(value);

const version = (schedule: Schedule, amount = 1000): RuleVersion => ({
  effectiveFrom: month("2026-01"),
  amount: amount as MinorUnits,
  schedule,
});

/** The summary line as the screen renders it: the parts joined by the translated separator. */
function summaryLine(version: RuleVersion, lang: Language, on = activeMonth): string {
  // The real resources, reached through the `items` namespace like the screen does.
  const t = createI18n(lang).t as unknown as (
    key: string,
    options?: Record<string, string | number | boolean>,
  ) => string;
  return joinSummary(summarizeVersion(version, on), (key, options) =>
    t(key, { ns: "items", ...options }),
  );
}

describe("summarizeVersion", () => {
  it("names the rhythm and the day of a monthly item", () => {
    // Arrange
    const rent = version({
      kind: "recurring",
      intervalMonths: 1,
      anchor: month("2026-01"),
      dayOfMonth: 10,
    });

    // Act
    const lines = [summaryLine(rent, "en"), summaryLine(rent, "pl")];

    // Assert
    expect(lines).toEqual(["Monthly · on the 10th", "Co miesiąc · 10. dnia"]);
  });

  it("counts a longer rhythm", () => {
    // Arrange
    const quarterly = version({ kind: "recurring", intervalMonths: 3, anchor: month("2026-01") });

    // Act
    const lines = [summaryLine(quarterly, "en"), summaryLine(quarterly, "pl")];

    // Assert
    expect(lines).toEqual(["Every 3 months", "Co 3 miesiące"]);
  });

  it("names the month of a yearly item on its own", () => {
    // Arrange
    const insurance = version({ kind: "recurring", intervalMonths: 12, anchor: month("2026-03") });

    // Act
    const lines = [summaryLine(insurance, "en"), summaryLine(insurance, "pl")];

    // Assert
    expect(lines).toEqual(["Yearly · March", "Co roku · marzec"]);
  });

  it("says which month an item that has not started yet begins from", () => {
    // Arrange
    const later = version({ kind: "recurring", intervalMonths: 3, anchor: month("2027-02") });

    // Act
    const lines = [summaryLine(later, "en"), summaryLine(later, "pl")];

    // Assert
    expect(lines).toEqual(["Every 3 months from Feb 2027", "Co 3 miesiące od lutego 2027"]);
  });

  it("names the month of a one-time item, also after it has passed", () => {
    // Arrange
    const oneTime = version({ kind: "one-time", month: month("2026-11") });
    const past = version({ kind: "one-time", month: month("2026-05") });

    // Act
    const lines = [summaryLine(oneTime, "en"), summaryLine(past, "pl")];

    // Assert
    expect(lines).toEqual(["One-time · Nov 2026", "Jednorazowo · maj 2026"]);
  });

  it("says until when a recurring item still runs", () => {
    // Arrange
    const gym = version({
      kind: "recurring",
      intervalMonths: 1,
      anchor: month("2026-01"),
      endMonth: month("2027-06"),
    });

    // Act
    const lines = [summaryLine(gym, "en"), summaryLine(gym, "pl")];

    // Assert
    expect(lines).toEqual(["Monthly · until Jun 2027", "Co miesiąc · do czerwca 2027"]);
  });

  it("says only that an item whose last occurrence has passed has ended", () => {
    // Arrange: every 3 months from Jan 2026 to Aug 2026, so the last occurrence is Jul, before Oct.
    const finished = version({
      kind: "recurring",
      intervalMonths: 3,
      anchor: month("2026-01"),
      endMonth: month("2026-08"),
    });

    // Act
    const lines = [summaryLine(finished, "en"), summaryLine(finished, "pl")];

    // Assert
    expect(lines).toEqual(["Ended Jul 2026", "Zakończona w lipcu 2026"]);
  });

  it("summarises a schedule core rejects as nothing", () => {
    // Arrange: an archived item's history can hold a broken schedule (#81 never validates it).
    const broken = version({ kind: "recurring", intervalMonths: 0, anchor: month("2026-01") });

    // Act
    const parts = summarizeVersion(broken, activeMonth);

    // Assert
    expect(parts).toEqual([]);
  });
});
