// The month the app anchors to (#112): the stored active month when there is one, the device's own calendar
// month until onboarding (#111) opens the first one.
import { toYearMonth } from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import { localCalendarMonth, resolveActiveMonth } from "./active-month";

describe("resolveActiveMonth", () => {
  it("uses the stored active month when the table has one", () => {
    // Arrange: the budget is closing January while the device already reads March.
    const stored = toYearMonth("2026-01");
    const now = new Date(2026, 2, 15);

    // Act
    const month = resolveActiveMonth(stored, now);

    // Assert
    expect(month).toBe("2026-01");
  });

  it("falls back to the calendar month while no month is open", () => {
    // Arrange
    const now = new Date(2026, 9, 22, 18, 30);

    // Act
    const month = resolveActiveMonth(undefined, now);

    // Assert
    expect(month).toBe("2026-10");
  });

  it("reads the local date, not the instant", () => {
    // Arrange: a minute before midnight changes the calendar month for the user.
    const endOfMonth = new Date(2026, 11, 31, 23, 59);
    const startOfNext = new Date(2027, 0, 1, 0, 0);

    // Act / Assert
    expect(localCalendarMonth(endOfMonth)).toBe("2026-12");
    expect(localCalendarMonth(startOfNext)).toBe("2027-01");
  });
});
