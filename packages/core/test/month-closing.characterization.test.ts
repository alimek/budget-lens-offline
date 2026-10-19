/**
 * Characterization tests for legacy month closing (actions/months.ts).
 */
import { describe, expect, it } from "vitest";
import { toMinorUnits } from "../src/money";
import { type ActiveMonth, closeMonth, updateBalance } from "../src/month-closing";
import { toYearMonth } from "../src/year-month";
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
    // LEGACY: missing closed totals – fixed in #84: closeMonth (src/month-closing.test.ts).
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
    // LEGACY: opening_balance 0 and mixed time bases – fixed in #84: createInitialMonth (src/month-closing.test.ts).
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

/** Legacy mapping belongs only in tests; the offline app does not import old data. */
function coreMonth(row: LegacyMonthRow): ActiveMonth {
  return {
    month: toYearMonth(`${row.year}-${String(row.month).padStart(2, "0")}`),
    status: "active",
    openingBalance: toMinorUnits(Math.round(row.opening_balance * 100)),
    closingBalance: toMinorUnits(Math.round(row.closing_balance * 100)),
    totalIncome: toMinorUnits(Math.round(row.total_income * 100)),
    totalExpenses: toMinorUnits(Math.round(row.total_expenses * 100)),
    netChange: toMinorUnits(Math.round(row.net_change * 100)),
  };
}

describe("ported month transitions compared with legacy", () => {
  it.each([10, 12])("keeps balance carry-forward and calendar rollover for month %i", (month) => {
    const row = activeMonth({ month });
    const current = coreMonth(row);
    const legacy = legacyCloseMonth(row).nextMonthInsert;

    const result = closeMonth([current], {
      baseCurrency: "PLN",
      rates: {},
      currentMonth: current.month,
      closingBalance: current.closingBalance,
      items: [],
      overrides: [],
      paymentStatuses: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.next).toMatchObject({
      month: toYearMonth(`${legacy.year}-${String(legacy.month).padStart(2, "0")}`),
      openingBalance: toMinorUnits(Math.round(legacy.opening_balance * 100)),
      closingBalance: toMinorUnits(Math.round(legacy.closing_balance * 100)),
      netChange: toMinorUnits(0),
    });
  });

  it("keeps actual net change relative to opening balance", () => {
    const row = activeMonth();
    const legacy = legacyUpdateMonthBalance(row, 11000);

    const result = updateBalance(coreMonth(row), toMinorUnits(1_100_000));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.netChange).toBe(toMinorUnits(Math.round(legacy.net_change * 100)));
  });
});
