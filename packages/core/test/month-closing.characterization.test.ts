/**
 * Characterization tests for legacy month closing (actions/months.ts).
 */
import { describe, expect, it } from "vitest";
import { freezeClockAt, useFrozenClock } from "./helpers";
import {
  type LegacyMonthRow,
  legacyCloseMonth,
  legacyInitialMonth,
  legacyUpdateMonthBalance,
} from "./legacy/month-closing";

const NOW = "2026-10-31T20:15:00.000Z";
useFrozenClock(NOW, "Europe/Warsaw");

function activeMonth(overrides: Partial<LegacyMonthRow> = {}): LegacyMonthRow {
  return {
    id: "month-1",
    month: 10,
    year: 2026,
    status: "active",
    opening_balance: 12000,
    closing_balance: 15432.5,
    total_income: 0,
    total_expenses: 0,
    net_change: 3432.5,
    ...overrides,
  };
}

describe("legacyCloseMonth", () => {
  it("opens the next month with opening balance = closing balance of the closed month", () => {
    // Arrange
    const october = activeMonth();

    // Act
    const { nextMonthInsert } = legacyCloseMonth(october);

    // Assert
    expect(nextMonthInsert).toEqual({
      month: 11,
      year: 2026,
      status: "active",
      opening_balance: 15432.5,
      closing_balance: 15432.5,
      total_income: 0,
      total_expenses: 0,
      net_change: 0,
      started_at: NOW,
    });
  });

  it("rolls December over into January of the next year", () => {
    // Arrange
    const december = activeMonth({ month: 12, year: 2026 });

    // Act
    const { nextMonthInsert } = legacyCloseMonth(december);

    // Assert
    expect([nextMonthInsert.month, nextMonthInsert.year]).toEqual([1, 2027]);
  });

  it("closes the month without storing its totals", () => {
    // LEGACY: total_income / total_expenses / net_change of the closed month are not written – changed by #7.
    // Arrange
    const october = activeMonth();

    // Act
    const { closeUpdate } = legacyCloseMonth(october);

    // Assert
    expect(closeUpdate).toEqual({ status: "closed", closed_at: NOW, updated_at: NOW });
  });
});

describe("legacyUpdateMonthBalance", () => {
  it("stores the closing balance and the net change relative to the opening balance", () => {
    // Arrange
    const october = activeMonth({ opening_balance: 12000 });

    // Act
    const update = legacyUpdateMonthBalance(october, 11000);

    // Assert
    expect(update).toEqual({ closing_balance: 11000, net_change: -1000, updated_at: NOW });
  });
});

describe("legacyInitialMonth", () => {
  it("starts the first month at 0, taking the month from local time and started_at from UTC", () => {
    // LEGACY: opening_balance 0 and mixed time bases – changed by #7.
    // Arrange: 23:30 UTC on 31 January is already February in Warsaw.
    freezeClockAt("2026-01-31T23:30:00.000Z", "Europe/Warsaw");

    // Act
    const first = legacyInitialMonth();

    // Assert
    expect(first.opening_balance).toBe(0);
    expect([first.month, first.year]).toEqual([2, 2026]);
    expect(first.started_at).toBe("2026-01-31T23:30:00.000Z");
  });
});
