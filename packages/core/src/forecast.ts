import { convertMinor } from "./convert-minor";
import { type CurrencyCode, isCurrencyCode } from "./currency";
import {
  addMinorUnits,
  isMinorUnits,
  type MinorUnits,
  subtractMinorUnits,
  toMinorUnits,
} from "./money";
import {
  type ItemType,
  type OccurrenceOverride,
  type RejectedOverride,
  resolveOccurrences,
  type ScheduledItem,
} from "./occurrence-overrides";
import { MAX_FORECAST_HORIZON_MONTHS, type Settings, updateSettings } from "./settings";
import { addMonths, isYearMonth, type YearMonth } from "./year-month";

/** Forecast-local currency requirement until the shared item model gains currency (#138). */
export interface ForecastItem extends ScheduledItem {
  readonly currency: CurrencyCode;
}

export interface PaymentStatus {
  readonly itemType: ItemType;
  readonly itemId: string;
  readonly month: YearMonth;
  readonly paid: boolean;
}

/** Current cached candidate, quoted as 1 currency = mid PLN. Freshness is supplied by the cache (#8/#93). */
export interface ForecastRate {
  readonly currency: CurrencyCode;
  readonly mid: string;
  readonly effectiveDate: string;
  readonly source: "nbp" | "manual";
  readonly stale: boolean;
}

export interface ForecastInput {
  readonly items: readonly ForecastItem[];
  readonly overrides: readonly OccurrenceOverride[];
  readonly paymentStatuses: readonly PaymentStatus[];
  /** Current balance and today's per-row converted savings, both in base-currency minor units. */
  readonly currentBalance: MinorUnits;
  readonly totalSavings: MinorUnits;
  /** The active month, not a request to recalculate closed history. */
  readonly fromMonth: YearMonth;
  readonly months?: number;
  readonly settings: Settings;
  readonly rates: readonly ForecastRate[];
}

export interface ForecastMonth {
  readonly month: YearMonth;
  readonly income: MinorUnits;
  readonly expenses: MinorUnits;
  readonly netChange: MinorUnits;
  readonly balance: MinorUnits;
  readonly totalFunds: MinorUnits;
}

export interface ForecastWarning {
  readonly code: "negative-balance" | "low-balance" | "large-outflow";
  readonly type: "critical" | "caution" | "info";
  readonly month: YearMonth;
  readonly params: {
    readonly amount: MinorUnits;
    readonly threshold: MinorUnits;
    readonly currency: CurrencyCode;
    /** Includes the active month (1), matching the legacy warning horizon. */
    readonly monthsAhead: number;
  };
}

export type ForecastError =
  | {
      readonly code:
        | "invalid-month"
        | "invalid-horizon"
        | "invalid-settings"
        | "invalid-amount"
        | "amount-overflow";
    }
  | { readonly code: "invalid-item"; readonly itemId: string }
  | { readonly code: "missing-rate" | "invalid-rate"; readonly currency: CurrencyCode };

export type ForecastResult =
  | {
      readonly ok: true;
      readonly currency: CurrencyCode;
      readonly forecast: readonly ForecastMonth[];
      readonly warnings: readonly ForecastWarning[];
      readonly ratesUsed: readonly ForecastRate[];
      readonly rejectedOverrides: readonly RejectedOverride[];
      readonly invalidItems: readonly ForecastItem[];
    }
  | { readonly ok: false; readonly error: ForecastError };

const paymentKey = (itemType: ItemType, itemId: string, month: YearMonth): string =>
  JSON.stringify([itemType, itemId, month]);

/** Latest effective date wins; manual wins a tie, consistent with #39. Inputs contain current candidates only. */
function currentRates(rates: readonly ForecastRate[]): Map<CurrencyCode, ForecastRate> {
  const selected = new Map<CurrencyCode, ForecastRate>();
  for (const rate of rates) {
    const previous = selected.get(rate.currency);
    if (
      previous === undefined ||
      rate.effectiveDate > previous.effectiveDate ||
      (rate.effectiveDate === previous.effectiveDate && rate.source === "manual")
    ) {
      selected.set(rate.currency, rate);
    }
  }
  return selected;
}

function warningsFor(row: ForecastMonth, index: number, settings: Settings): ForecastWarning[] {
  const warnings: ForecastWarning[] = [];
  const append = (
    code: ForecastWarning["code"],
    type: ForecastWarning["type"],
    amount: MinorUnits,
    threshold: MinorUnits,
  ) => {
    warnings.push({
      code,
      type,
      month: row.month,
      params: {
        amount,
        threshold,
        currency: settings.baseCurrency,
        monthsAhead: index + 1,
      },
    });
  };
  if (row.balance < 0) {
    append("negative-balance", "critical", row.balance, toMinorUnits(0));
  } else if (row.balance < settings.lowBalanceThreshold) {
    append("low-balance", "caution", row.balance, settings.lowBalanceThreshold);
  }
  if (row.netChange < -settings.largeExpenseThreshold) {
    append("large-outflow", "info", toMinorUnits(-row.netChange), settings.largeExpenseThreshold);
  }
  return warnings;
}

function validHorizon(fromMonth: YearMonth, months: number): boolean {
  if (!Number.isSafeInteger(months) || months < 1 || months > MAX_FORECAST_HORIZON_MONTHS) {
    return false;
  }
  try {
    addMonths(fromMonth, months - 1);
    return true;
  } catch {
    return false;
  }
}

function validItem(item: ForecastItem): boolean {
  return (
    isCurrencyCode(item.currency) &&
    isMinorUnits(item.amount) &&
    item.amount >= 0 &&
    (item.itemType === "income" || item.itemType === "expense")
  );
}

function inputError(input: ForecastInput): ForecastError | undefined {
  const { settings, fromMonth, currentBalance, totalSavings, items } = input;
  if (!updateSettings(settings, {}).ok) {
    return { code: "invalid-settings" };
  }
  if (!isYearMonth(fromMonth)) {
    return { code: "invalid-month" };
  }
  if (!validHorizon(fromMonth, input.months ?? settings.forecastHorizonMonths)) {
    return { code: "invalid-horizon" };
  }
  if (!isMinorUnits(currentBalance) || !isMinorUnits(totalSavings)) {
    return { code: "invalid-amount" };
  }
  const invalid = items.find((item) => !validItem(item));
  return invalid === undefined ? undefined : { code: "invalid-item", itemId: invalid.id };
}

/** Validate only needed legs; cache their metadata for the UI once across the horizon. */
function collectRates(
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ReadonlyMap<CurrencyCode, ForecastRate>,
  used: Map<CurrencyCode, ForecastRate>,
): ForecastError | undefined {
  if (from === to) return undefined;
  for (const currency of [from, to]) {
    if (currency === "PLN" || used.has(currency)) continue;
    const rate = rates.get(currency);
    if (rate === undefined) return { code: "missing-rate", currency };
    try {
      convertMinor(toMinorUnits(0), currency, "PLN", () => rate.mid);
    } catch {
      return { code: "invalid-rate", currency };
    }
    used.set(currency, rate);
  }
  return undefined;
}

/** Projects the active and future months only; all rows and warning parameters use the base currency. */
export function forecast(input: ForecastInput): ForecastResult {
  const error = inputError(input);
  if (error !== undefined) return { ok: false, error };
  const { items, overrides, paymentStatuses, currentBalance, totalSavings, fromMonth, settings } =
    input;
  const months = input.months ?? settings.forecastHorizonMonths;
  const rates = currentRates(input.rates);
  const used = new Map<CurrencyCode, ForecastRate>();
  const paid = new Set(
    paymentStatuses
      .filter((status) => status.paid)
      .map((status) => paymentKey(status.itemType, status.itemId, status.month)),
  );
  const rows: ForecastMonth[] = [];
  const warnings: ForecastWarning[] = [];
  let balance = currentBalance;
  let rejectedOverrides: readonly RejectedOverride[] = [];
  let invalidItems: readonly ForecastItem[] = [];
  try {
    for (let index = 0; index < months; index++) {
      const month = addMonths(fromMonth, index);
      const resolved = resolveOccurrences(items, overrides, month);
      rejectedOverrides = resolved.rejectedOverrides;
      invalidItems = resolved.invalidItems;
      let income = toMinorUnits(0);
      let expenses = toMinorUnits(0);
      const remaining = resolved.occurrences.filter(
        ({ item }) => index !== 0 || !paid.has(paymentKey(item.itemType, item.id, month)),
      );
      for (const { item, amount } of remaining) {
        const rateError = collectRates(item.currency, settings.baseCurrency, rates, used);
        if (rateError !== undefined) return { ok: false, error: rateError };
        const baseAmount = convertMinor(
          amount,
          item.currency,
          settings.baseCurrency,
          (currency) => rates.get(currency)?.mid,
        );
        if (item.itemType === "income") income = addMinorUnits(income, baseAmount);
        else expenses = addMinorUnits(expenses, baseAmount);
      }
      const netChange = subtractMinorUnits(income, expenses);
      balance = addMinorUnits(balance, netChange);
      const row = {
        month,
        income,
        expenses,
        netChange,
        balance,
        totalFunds: addMinorUnits(balance, totalSavings),
      };
      rows.push(row);
      warnings.push(...warningsFor(row, index, settings));
    }
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, error: { code: "amount-overflow" } };
  }
  return {
    ok: true,
    currency: settings.baseCurrency,
    forecast: rows,
    warnings,
    ratesUsed: [...used.values()],
    rejectedOverrides,
    invalidItems,
  };
}
