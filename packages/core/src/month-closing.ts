import { type CurrencyCode, isCurrencyCode } from "./currency";
import {
  convertMinor,
  isMinorUnits,
  type MinorUnits,
  subtractMinorUnits,
  sumMinorUnits,
  toMinorUnits,
} from "./money";
import {
  type ItemType,
  type OccurrenceOverride,
  type ResolvedOccurrence,
  resolveOccurrences,
  type ScheduledItem,
} from "./occurrence-overrides";
import { addMonths, isYearMonth, type YearMonth } from "./year-month";

/** Paid for an expense, received for an income; absent rows mean unsettled. Storage belongs to #83. */
export interface PaymentStatus {
  readonly itemType: ItemType;
  readonly itemId: string;
  readonly month: YearMonth;
  readonly settled: boolean;
}

/**
 * An item closing plans a month from: `ScheduledItem`, whose `amount` and occurrence overrides are minor units of
 * its own required `currency` (#138). Closing converts each effective occurrence into the base currency.
 */
export type ClosingItem = ScheduledItem;

/** Base-currency major units per source major unit, selected by the caller for the closing month. */
export interface ClosingConversion {
  readonly baseCurrency: CurrencyCode;
  readonly rates: Readonly<Partial<Record<CurrencyCode, number>>>;
}

/** Frozen facts, independent of item names, rules and overrides after closing. */
export interface ClosedOccurrence extends PaymentStatus {
  readonly amount: MinorUnits;
  readonly currency: CurrencyCode;
  readonly rate: number;
  readonly baseAmount: MinorUnits;
}

interface MonthTotals {
  readonly month: YearMonth;
  readonly openingBalance: MinorUnits;
  readonly closingBalance: MinorUnits;
  readonly totalIncome: MinorUnits;
  readonly totalExpenses: MinorUnits;
  /** Actual balance change, which can differ from planned income minus expenses. */
  readonly netChange: MinorUnits;
}

export interface ActiveMonth extends MonthTotals {
  readonly status: "active";
}

export interface ClosedMonth extends MonthTotals {
  readonly status: "closed";
  readonly baseCurrency: CurrencyCode;
  readonly closedOccurrences: readonly ClosedOccurrence[];
}

export type BudgetMonth = ActiveMonth | ClosedMonth;

export type MonthClosingErrorCode =
  | "month-closed"
  | "no-active-month"
  | "multiple-active-months"
  | "invalid-month"
  | "future-month"
  | "month-sequence-conflict"
  | "month-out-of-range"
  | "invalid-currency"
  | "missing-exchange-rate"
  | "invalid-exchange-rate"
  | "invalid-amount"
  | "amount-overflow"
  | "invalid-occurrences"
  | "invalid-payment-status"
  | "duplicate-payment-status";

type Result<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly error: MonthClosingErrorCode;
    };

const failure = (error: MonthClosingErrorCode) => ({ ok: false as const, error });
const validMonth = (month: YearMonth): boolean => typeof month === "string" && isYearMonth(month);
const validAmount = (amount: MinorUnits): boolean =>
  typeof amount === "number" && isMinorUnits(amount);
const paymentKey = ({ itemType, itemId, month }: Omit<PaymentStatus, "settled">): string =>
  JSON.stringify([itemType, itemId, month]);

/** The one policy guard for closed-month writes; reopening is out of MVP pending #40. */
export function validateMonthEditable(month: BudgetMonth): "month-closed" | undefined {
  return month.status === "closed" ? "month-closed" : undefined;
}

function activeMonth(month: YearMonth, balance: MinorUnits): ActiveMonth {
  return Object.freeze({
    month,
    status: "active",
    openingBalance: balance,
    closingBalance: balance,
    totalIncome: toMinorUnits(0),
    totalExpenses: toMinorUnits(0),
    netChange: toMinorUnits(0),
  });
}

/** The caller supplies the calendar month and initial balance explicitly, without reading a clock. */
export function createInitialMonth(
  month: YearMonth,
  openingBalance: MinorUnits,
): Result<ActiveMonth> {
  if (!validMonth(month)) return failure("invalid-month");
  if (!validAmount(openingBalance)) return failure("invalid-amount");
  return { ok: true, value: activeMonth(month, openingBalance) };
}

/** Records the actual balance, preserving the opening balance and never changing the input. */
export function updateBalance(month: BudgetMonth, balance: MinorUnits): Result<ActiveMonth> {
  const error = validateMonthEditable(month);
  if (error !== undefined) return failure(error);
  if (!validMonth(month.month)) return failure("invalid-month");
  if (!validAmount(balance) || !validAmount(month.openingBalance)) return failure("invalid-amount");
  try {
    const netChange = subtractMinorUnits(balance, month.openingBalance);
    return {
      ok: true,
      value: Object.freeze({ ...month, status: "active", closingBalance: balance, netChange }),
    };
  } catch {
    return failure("amount-overflow");
  }
}

function convertOccurrenceAmount(
  amount: MinorUnits,
  currency: CurrencyCode,
  conversion: ClosingConversion,
): Result<Pick<ClosedOccurrence, "rate" | "baseAmount">> {
  if (!isCurrencyCode(currency)) return failure("invalid-currency");
  const foreignRate = Object.hasOwn(conversion.rates, currency)
    ? conversion.rates[currency]
    : undefined;
  const rate = currency === conversion.baseCurrency ? 1 : foreignRate;
  if (rate === undefined) return failure("missing-exchange-rate");
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    return failure("invalid-exchange-rate");
  }
  try {
    const baseAmount = convertMinor(amount, rate, currency, conversion.baseCurrency);
    return { ok: true, value: { rate, baseAmount } };
  } catch {
    return failure("amount-overflow");
  }
}

function validPaymentStatus(status: PaymentStatus): boolean {
  return (
    status !== null &&
    typeof status === "object" &&
    (status.itemType === "expense" || status.itemType === "income") &&
    typeof status.itemId === "string" &&
    status.itemId.length > 0 &&
    validMonth(status.month) &&
    typeof status.settled === "boolean"
  );
}

/** Snapshot policy isolated here so #40 can change it without changing the close transition. */
export function buildClosedOccurrences(
  occurrences: readonly ResolvedOccurrence<ClosingItem>[],
  paymentStatuses: readonly PaymentStatus[],
  conversion: ClosingConversion,
): Result<readonly ClosedOccurrence[]> {
  if (!isCurrencyCode(conversion.baseCurrency)) return failure("invalid-currency");
  const payments = new Map<string, boolean>();
  for (const status of paymentStatuses) {
    if (!validPaymentStatus(status)) return failure("invalid-payment-status");
    const key = paymentKey(status);
    if (payments.has(key)) return failure("duplicate-payment-status");
    payments.set(key, status.settled);
  }
  const seen = new Set<string>();
  const snapshot: ClosedOccurrence[] = [];
  for (const { item, month, amount } of occurrences) {
    const identity = { itemType: item.itemType, itemId: item.id, month };
    const key = paymentKey(identity);
    if (seen.has(key)) return failure("invalid-occurrences");
    if (!validAmount(amount) || amount < 0) return failure("invalid-amount");
    const converted = convertOccurrenceAmount(amount, item.currency, conversion);
    if (!converted.ok) return converted;
    seen.add(key);
    snapshot.push(
      Object.freeze({
        ...identity,
        amount,
        currency: item.currency,
        ...converted.value,
        settled: payments.get(key) ?? false,
      }),
    );
  }
  return { ok: true, value: Object.freeze(snapshot) };
}

export interface CloseMonthInput extends ClosingConversion {
  readonly currentMonth: YearMonth;
  readonly closingBalance: MinorUnits;
  readonly items: readonly ClosingItem[];
  readonly overrides: readonly OccurrenceOverride[];
  readonly paymentStatuses: readonly PaymentStatus[];
}

export interface MonthClosing {
  readonly closed: ClosedMonth;
  readonly next: ActiveMonth;
  readonly unpaid: readonly ClosedOccurrence[];
  readonly unreceived: readonly ClosedOccurrence[];
}

/**
 * Plans a close from the complete month collection. The caller can inspect unpaid/unreceived before committing
 * this pure result; #85 persists closed, its snapshot and next in one transaction. No future months can close.
 */
export function closeMonth(
  months: readonly BudgetMonth[],
  input: CloseMonthInput,
): Result<MonthClosing> {
  if (months.some((month) => month === null || typeof month !== "object")) {
    return failure("invalid-month");
  }
  const active = months.filter((month) => month.status === "active");
  const [month] = active;
  if (month === undefined) return failure("no-active-month");
  if (active.length !== 1) return failure("multiple-active-months");
  const updated = updateBalance(month, input.closingBalance);
  if (!updated.ok) return updated;
  if (!validMonth(input.currentMonth)) return failure("invalid-month");
  if (month.month > input.currentMonth) return failure("future-month");
  if (month.month === "9999-12") return failure("month-out-of-range");
  const nextMonth = addMonths(month.month, 1);
  if (months.some((existing) => existing.status === "closed" && existing.month >= month.month)) {
    return failure("month-sequence-conflict");
  }

  const resolved = resolveOccurrences(input.items, input.overrides, month.month);
  if (resolved.invalidItems.length > 0 || resolved.rejectedOverrides.length > 0) {
    return failure("invalid-occurrences");
  }
  const snapshot = buildClosedOccurrences(resolved.occurrences, input.paymentStatuses, input);
  if (!snapshot.ok) return snapshot;
  try {
    // Every `baseAmount` was converted from the item's own currency to `baseCurrency` per row above, so these
    // totals add amounts of one currency (#138).
    const totalIncome = sumMinorUnits(
      snapshot.value.filter((row) => row.itemType === "income").map((row) => row.baseAmount),
    );
    const totalExpenses = sumMinorUnits(
      snapshot.value.filter((row) => row.itemType === "expense").map((row) => row.baseAmount),
    );
    const closed: ClosedMonth = Object.freeze({
      ...updated.value,
      status: "closed",
      totalIncome,
      totalExpenses,
      baseCurrency: input.baseCurrency,
      closedOccurrences: snapshot.value,
    });
    return {
      ok: true,
      value: {
        closed,
        next: activeMonth(nextMonth, input.closingBalance),
        unpaid: snapshot.value.filter((row) => row.itemType === "expense" && !row.settled),
        unreceived: snapshot.value.filter((row) => row.itemType === "income" && !row.settled),
      },
    };
  } catch {
    return failure("amount-overflow");
  }
}
