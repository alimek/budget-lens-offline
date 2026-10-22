// The month the app anchors to (#112): the stored active month when there is one, the device's own calendar
// month only while the months table has none – until onboarding (#111) opens the first one.
import { toYearMonth } from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import { localCalendarMonth, type MonthRead, resolveActiveMonth } from "./active-month";

/** The read of the `months` table, in the shape the live read reports it. */
const read = (status: MonthRead["status"], value?: string): MonthRead => ({
  status,
  value: value === undefined ? undefined : toYearMonth(value),
});

const clock = new Date(2026, 9, 22, 18, 30);

describe("resolveActiveMonth", () => {
  it("uses the stored active month when the table has one", () => {
    // Arrange: the budget is closing January while the device already reads October.
    const stored = read("ready", "2026-01");

    // Act
    const month = resolveActiveMonth(stored, clock);

    // Assert
    expect(month).toBe("2026-01");
  });

  it("falls back to the calendar month only when a ready table has no active month", () => {
    // Arrange / Act
    const month = resolveActiveMonth(read("ready"), clock);

    // Assert
    expect(month).toBe("2026-10");
  });

  it("has no month while the read is pending or failed", () => {
    // Arrange / Act
    const pending = resolveActiveMonth(read("loading"), clock);
    const failed = resolveActiveMonth(read("error"), clock);

    // Assert: neither the first frame nor a broken read invents a month to anchor the list to.
    expect(pending).toBeUndefined();
    expect(failed).toBeUndefined();
  });

  it("reads the local date, not the instant", () => {
    // Arrange: half an hour before midnight of 30 November in UTC, which is already December in Warsaw.
    const instant = Date.UTC(2026, 10, 30, 23, 30);
    const zone = process.env["TZ"];
    process.env["TZ"] = "Europe/Warsaw";
    try {
      // Act
      const month = localCalendarMonth(new Date(instant));

      // Assert: a UTC-based read would still say November here.
      expect(month).toBe("2026-12");
    } finally {
      if (zone === undefined) delete process.env["TZ"];
      else process.env["TZ"] = zone;
    }
  });
});
