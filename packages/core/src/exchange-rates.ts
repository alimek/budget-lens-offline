import { type CurrencyCode, isCurrencyCode } from "./currency";
import type { Settings } from "./settings";
import { daysInMonth, isYearMonth } from "./year-month";

export type RateSource = "nbp" | "manual";

/** Current quote: 1 currency unit = mid PLN. Never a floating-point amount. */
export interface RateQuote {
  readonly currency: CurrencyCode;
  readonly mid: string;
  readonly effectiveDate: string;
  readonly source: RateSource;
}

/** Fetch/entry time is retained for refresh scheduling, independently of quote freshness. */
export interface StoredRate extends RateQuote {
  readonly fetchedAt: number;
}

export interface RateError {
  readonly code:
    | "unsupported-currency"
    | "network-error"
    | "http-error"
    | "not-found"
    | "invalid-response"
    | "invalid-rate"
    | "missing-rate"
    | "storage-error";
  readonly currency?: CurrencyCode;
  readonly status?: number;
}

export type RateResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: RateError };

/** Fixed-width Gregorian dates sort chronologically, including leap days. */
export function isRateDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const month = value.slice(0, 7);
  const day = Number(value.slice(8));
  return isYearMonth(month) && day >= 1 && day <= daysInMonth(month);
}

export function isRateQuote(value: unknown): value is RateQuote {
  if (typeof value !== "object" || value === null) return false;
  const rate = value as Record<string, unknown>;
  const mid = rate["mid"];
  return (
    isCurrencyCode(rate["currency"]) &&
    rate["currency"] !== "PLN" &&
    (rate["source"] === "nbp" || rate["source"] === "manual") &&
    isRateDate(rate["effectiveDate"]) &&
    typeof mid === "string" &&
    /^\d+(?:\.\d{1,12})?$/.test(mid) &&
    Number.isFinite(Number(mid)) &&
    Number(mid) > 0
  );
}

export function isStoredRate(value: unknown): value is StoredRate {
  return (
    isRateQuote(value) &&
    "fetchedAt" in value &&
    typeof value.fetchedAt === "number" &&
    Number.isSafeInteger(value.fetchedAt) &&
    value.fetchedAt >= 0
  );
}

/** Shared with consumers such as forecast: newest effective date wins, manual wins a tie (#8). */
export function selectCurrentRates<
  Rate extends Pick<RateQuote, "currency" | "effectiveDate" | "source">,
>(rates: readonly Rate[]): Map<CurrencyCode, Rate> {
  const selected = new Map<CurrencyCode, Rate>();
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

/** Refresh needs both PLN legs of every conversion, including the non-PLN base. */
export function requiredRateCurrencies(
  settings: Pick<Settings, "baseCurrency" | "trackedCurrencies">,
  itemCurrencies: readonly CurrencyCode[],
  savingsCurrencies: readonly CurrencyCode[],
): CurrencyCode[] {
  return [
    ...new Set([
      settings.baseCurrency,
      ...settings.trackedCurrencies,
      ...itemCurrencies,
      ...savingsCurrencies,
    ]),
  ].filter((currency) => currency !== "PLN");
}

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 (a Thursday) for a validated YYYY-MM-DD, at UTC midnight so the host timezone never matters. */
function toDayNumber(date: string): number {
  return Date.parse(date) / DAY_MS;
}

/** Mon–Fri days in the day-number range [from, to). */
function countBusinessDays(from: number, to: number): number {
  if (to <= from) return 0;
  const length = to - from;
  let count = Math.floor(length / 7) * 5;
  for (let day = from + length - (length % 7); day < to; day += 1) {
    // 1970-01-01 is a Thursday: weekday 0 = Sunday … 6 = Saturday.
    const weekday = (((day + 4) % 7) + 7) % 7;
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

/**
 * Number of business days (Mon–Fri) strictly between two `YYYY-MM-DD` calendar dates, both ends excluded.
 * Holidays are not modelled (MVP). Returns 0 when `to` is not after `from`. Pure: no clock, no host timezone.
 */
export function businessDaysBetween(from: string, to: string): number {
  if (!isRateDate(from) || !isRateDate(to)) throw new RangeError("invalid-rate-date");
  return countBusinessDays(toDayNumber(from) + 1, toDayNumber(to));
}

function isBusinessDay(day: number): boolean {
  return countBusinessDays(day, day + 1) === 1;
}

/**
 * True when a business day (Mon–Fri, no holidays) lies after `effectiveDate`, up to and including `today`, i.e. a
 * newer NBP table may have been published since. Used by the app-open refresh gate.
 */
export function isNewerTableDue(effectiveDate: string, today: string): boolean {
  if (!isRateDate(effectiveDate) || !isRateDate(today)) throw new RangeError("invalid-rate-date");
  const todayNumber = toDayNumber(today);
  return (
    businessDaysBetween(effectiveDate, today) > 0 ||
    (todayNumber > toDayNumber(effectiveDate) && isBusinessDay(todayNumber))
  );
}

/**
 * A quote is stale when at least `maxAgeBusinessDays` business days (Mon–Fri, no holidays) lie strictly between
 * its effective date and today, i.e. when the effective date is older than `maxAgeBusinessDays` business days
 * before today. Applies to NBP and manual quotes alike; the caller passes today's local YYYY-MM-DD, never a clock.
 */
export function isRateStale(
  effectiveDate: string,
  today: string,
  maxAgeBusinessDays: number,
): boolean {
  if (
    !isRateDate(effectiveDate) ||
    !isRateDate(today) ||
    !Number.isSafeInteger(maxAgeBusinessDays) ||
    maxAgeBusinessDays <= 0
  ) {
    throw new RangeError("invalid-rate-freshness");
  }
  return businessDaysBetween(effectiveDate, today) >= maxAgeBusinessDays;
}
