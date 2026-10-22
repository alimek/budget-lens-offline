// The chart data of the #218 spike: a deterministic forecast-style sample, and the one place that turns integer
// minor units into the plain numbers `react-native-chart-kit` plots. Amounts stay `MinorUnits` everywhere else;
// `forecastChartRows` converts for the line and the axis, and `chartValueToMinorUnits` converts an axis tick back
// so the label is formatted by `packages/core` like every other amount on screen (#218, ADR 0012).
import {
  addMinorUnits,
  addMonths,
  type MinorUnits,
  toMinorUnits,
  type YearMonth,
} from "@budget-lens/core";

/** One projected month, in base-currency minor units: what the E6 forecast hands the chart (#89). */
export type ForecastSample = {
  readonly month: YearMonth;
  readonly balance: MinorUnits;
  readonly totalFunds: MinorUnits;
};

/**
 * One point of the chart. `month` is the x value and the two amounts are major units, which is a display scale
 * only: a row is never stored, and the readout of a tap goes back to the minor units of the sample.
 */
export type ForecastChartRow = {
  readonly month: YearMonth;
  readonly balance: number;
  readonly totalFunds: number;
};

/** PLN has two minor units per major unit; this is that ratio, not a rounding rule. */
const MINOR_UNITS_PER_MAJOR = 100;

/** The rolling balance the sample starts from: 4 250,00 zł. */
const START_BALANCE = toMinorUnits(425_000);

/** Savings held aside and kept constant across the horizon, so total funds sit above the balance: 6 000,00 zł. */
const TOTAL_SAVINGS = toMinorUnits(600_000);

/** The low-balance threshold the chart draws as a reference line: 2 000,00 zł. */
export const LOW_BALANCE_THRESHOLD = toMinorUnits(200_000);

/**
 * The net change of each sample month in grosze: twelve months that fall below the threshold, go negative in the
 * middle and recover under it again, so one chart exercises the zero line, the threshold and both signs.
 */
const MONTHLY_NET_CHANGES: readonly MinorUnits[] = [
  240_000, -312_345, -850_000, 181_250, -420_000, 225_000, -643_300, -190_000, 970_000, 330_000,
  115_000, -340_000,
].map(toMinorUnits);

/**
 * The sample forecast: `months` months from `fromMonth`, each balance the previous balance plus that month's net
 * change, each total funds that balance plus the constant savings. Deterministic and free of a clock, so the e2e
 * run can name the month and the amount it expects a tap to report.
 */
export function forecastSample(fromMonth: YearMonth, months = 12): ForecastSample[] {
  const changes = MONTHLY_NET_CHANGES.slice(0, months);
  let balance = START_BALANCE;
  return changes.map((change, index) => {
    balance = addMinorUnits(balance, change);
    return {
      month: addMonths(fromMonth, index),
      balance,
      totalFunds: addMinorUnits(balance, TOTAL_SAVINGS),
    };
  });
}

/** The rows chart-kit plots: the same months, with both series rescaled to major units for display. */
export function forecastChartRows(sample: readonly ForecastSample[]): ForecastChartRow[] {
  return sample.map((row) => ({
    month: row.month,
    balance: minorUnitsToChartValue(row.balance),
    totalFunds: minorUnitsToChartValue(row.totalFunds),
  }));
}

/**
 * The y axis always shows the zero line and the low-balance threshold, however the months move: a negative
 * balance and the threshold it fell under are the whole point of the forecast chart (#89).
 */
export function forecastChartDomain(
  sample: readonly ForecastSample[],
  threshold: MinorUnits = LOW_BALANCE_THRESHOLD,
): [number, number] {
  const values = sample.flatMap((row) => [row.balance, row.totalFunds]);
  const lowest = Math.min(...values, 0, threshold);
  const highest = Math.max(...values, 0, threshold);
  const padding = Math.max(Math.round((highest - lowest) / 20), 1);
  return [
    minorUnitsToChartValue(toMinorUnits(lowest - padding)),
    minorUnitsToChartValue(toMinorUnits(highest + padding)),
  ];
}

/** An axis tick back to minor units, so `formatMoney` formats the axis like any other amount on screen. */
export function chartValueToMinorUnits(value: number): MinorUnits {
  return toMinorUnits(Math.round(value * MINOR_UNITS_PER_MAJOR));
}

/** Minor units in the scale the chart plots: grosze in złoty, for display only. */
function minorUnitsToChartValue(amount: MinorUnits): number {
  return amount / MINOR_UNITS_PER_MAJOR;
}
