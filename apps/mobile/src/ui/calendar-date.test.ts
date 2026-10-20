import { describe, expect, it } from "vitest";
import {
  type CalendarDate,
  calendarDateToLocal,
  calendarDateToUtcMillis,
  formatCalendarDate,
  isCalendarDate,
  localToCalendarDate,
  utcMillisToCalendarDate,
} from "./calendar-date";

describe("isCalendarDate", () => {
  it.each(["2026-10-10", "2028-02-29"])("accepts %s", (value) => {
    // Act
    const result = isCalendarDate(value);

    // Assert
    expect(result).toBe(true);
  });

  it.each(["2026-04-31", "2027-02-29", "2026-13-01", "2026-1-5", "10.10.2026", ""])(
    "rejects %s",
    (value) => {
      // Act
      const result = isCalendarDate(value);

      // Assert
      expect(result).toBe(false);
    },
  );
});

describe("local dates (SwiftUI DatePicker)", () => {
  it("round-trips a day through local midnight", () => {
    // Arrange
    const day: CalendarDate = "2026-03-29";

    // Act
    const local = calendarDateToLocal(day);

    // Assert
    expect(local.getHours()).toBe(0);
    expect(localToCalendarDate(local)).toBe(day);
  });

  it("keeps the local day of a late-evening selection", () => {
    // Arrange
    const lateEvening = new Date(2026, 9, 31, 23, 30);

    // Act
    const day = localToCalendarDate(lateEvening);

    // Assert
    expect(day).toBe("2026-10-31");
  });
});

describe("UTC millis (Material 3 DatePicker)", () => {
  it("uses the day's UTC midnight", () => {
    // Act
    const millis = calendarDateToUtcMillis("2026-10-10");

    // Assert
    expect(millis).toBe(Date.UTC(2026, 9, 10));
  });

  it("reads the UTC day back regardless of the device time zone", () => {
    // Arrange
    const selection = Date.UTC(2026, 0, 1);

    // Act
    const day = utcMillisToCalendarDate(selection);

    // Assert
    expect(day).toBe("2026-01-01");
  });
});

describe("formatCalendarDate", () => {
  it.each([
    ["pl", "10 paź 2026"],
    ["en", "Oct 10, 2026"],
  ] as const)("formats 2026-10-10 in %s as %s", (lang, expected) => {
    // Act
    const text = formatCalendarDate("2026-10-10", lang);

    // Assert
    expect(text).toBe(expected);
  });
});
