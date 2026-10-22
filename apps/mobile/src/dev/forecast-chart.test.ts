// The chart data of the #218 spike: the sample forecast walks like a forecast, and the scale change to the
// chart's axis keeps every grosz. Both matter for #89, where a chart must not round a balance away.
import { toMinorUnits, toYearMonth } from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import {
  chartValueToMinorUnits,
  forecastChartDomain,
  forecastChartRows,
  forecastSample,
  LOW_BALANCE_THRESHOLD,
} from "./forecast-chart";

describe("forecastSample", () => {
  it("walks each month by its net change and keeps the savings out of the balance", () => {
    // Arrange
    const fromMonth = toYearMonth("2026-11");

    // Act
    const sample = forecastSample(fromMonth, 12);

    // Assert
    expect(sample).toHaveLength(12);
    expect(sample[0]).toEqual({
      month: toYearMonth("2026-11"),
      balance: toMinorUnits(665_000),
      totalFunds: toMinorUnits(1_265_000),
    });
    expect(sample[11]?.month).toBe(toYearMonth("2027-10"));
    // A month with no net change of its own still moves the balance by the sum of those before it.
    expect(sample[7]?.balance).toBe(toMinorUnits(-1_344_395));
    // Total funds is always the balance plus the constant savings, never a number of its own.
    for (const row of sample) {
      expect(row.totalFunds - row.balance).toBe(600_000);
    }
  });
});

describe("forecastChartRows", () => {
  it("rescales to the chart's major units without losing a grosz", () => {
    // Arrange
    const sample = forecastSample(toYearMonth("2026-11"), 12);
    const negative = sample.find((row) => row.balance < 0);
    if (negative === undefined) throw new Error("the sample must project a negative month");

    // Act
    const [row] = forecastChartRows([negative]);

    // Assert
    expect(row).toEqual({
      month: negative.month,
      balance: negative.balance / 100,
      totalFunds: negative.totalFunds / 100,
    });
    // An odd number of grosze survives the round trip through the chart's own scale.
    expect(chartValueToMinorUnits(row?.balance ?? 0)).toBe(negative.balance);
  });
});

describe("forecastChartDomain", () => {
  it("keeps the zero line and the low-balance threshold on the axis", () => {
    // Arrange: a horizon that never goes near either line.
    const sample = [
      {
        month: toYearMonth("2027-01"),
        balance: toMinorUnits(20_000),
        totalFunds: toMinorUnits(32_000),
      },
    ];

    // Act
    const [lowest, highest] = forecastChartDomain(sample, LOW_BALANCE_THRESHOLD);

    // Assert
    expect(lowest).toBeLessThanOrEqual(0);
    expect(highest).toBeGreaterThanOrEqual(20_000 / 100);
    expect(lowest).toBeLessThanOrEqual(LOW_BALANCE_THRESHOLD / 100);
  });
});
