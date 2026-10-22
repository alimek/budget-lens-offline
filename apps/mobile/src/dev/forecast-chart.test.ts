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
    // Each month carries the running total, so this one is the start plus the eight changes up to it.
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
  it("lifts the axis up to the low-balance threshold no month of the sample reaches", () => {
    // Arrange: a horizon between 200,00 zł and 320,00 zł, below the 2 000,00 zł threshold.
    const sample = [
      {
        month: toYearMonth("2027-01"),
        balance: toMinorUnits(20_000),
        totalFunds: toMinorUnits(32_000),
      },
    ];

    // Act
    const [, highest] = forecastChartDomain(sample, LOW_BALANCE_THRESHOLD);

    // Assert: converted back to minor units, the top of the axis is at or above the threshold, which only
    // the threshold itself – and not any projected month – can reach.
    expect(chartValueToMinorUnits(highest)).toBeGreaterThanOrEqual(LOW_BALANCE_THRESHOLD);
  });

  it("keeps the axis at least at zero when every month is below it", () => {
    // Arrange: a horizon in debt, with a threshold below the whole of it, so only the zero line
    // itself can lift the top of the axis back to zero.
    const sample = [
      {
        month: toYearMonth("2027-01"),
        balance: toMinorUnits(-50_000),
        totalFunds: toMinorUnits(-10_000),
      },
    ];

    // Act
    const [, highest] = forecastChartDomain(sample, toMinorUnits(-100_000));

    // Assert
    expect(chartValueToMinorUnits(highest)).toBeGreaterThanOrEqual(0);
  });
});
