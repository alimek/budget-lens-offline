import { type CurrencyCode, isCurrencyCode } from "./currency";
import { isValidRateMaxAgeBusinessDays, type Settings } from "./settings";
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

/** Throws `RangeError("invalid-rate-date")` unless `value` is a valid `YYYY-MM-DD` calendar date. */
export function assertRateDate(value: unknown): asserts value is string {
  if (!isRateDate(value)) throw new RangeError("invalid-rate-date");
}

/** Throws `RangeError("invalid-rate-freshness")` unless `value` is a valid `rateMaxAgeBusinessDays`. */
export function assertFreshnessThreshold(value: unknown): asserts value is number {
  if (!isValidRateMaxAgeBusinessDays(value)) throw new RangeError("invalid-rate-freshness");
}

/** 01:00 UTC on the last Sunday of `month` (0-based) of `year`: the EU summer-time change instant. */
function lastSundayAt0100Utc(year: number, month: number): number {
  const lastDay = new Date(0);
  lastDay.setUTCFullYear(year, month + 1, 0);
  lastDay.setUTCHours(1, 0, 0, 0);
  return lastDay.getTime() - lastDay.getUTCDay() * 86_400_000;
}

/**
 * The Europe/Warsaw calendar date (`YYYY-MM-DD`) of an instant. NBP's `effectiveDate` is a Warsaw date, so
 * freshness and the refresh gate compare it with Warsaw's today, whatever the device time zone.
 *
 * Pure UTC arithmetic, no `Intl` (Hermes on iOS has no reliable `formatToParts`, see
 * docs/decisions/0012-native-intl-money-formatting.md). Poland follows the EU summer-time rule (Directive
 * 2000/84/EC): UTC+2 from 01:00 UTC on the last Sunday of March until 01:00 UTC on the last Sunday of October,
 * UTC+1 otherwise. The rule is hard-coded; revisit it if the directive changes (e.g. the EU drops DST).
 */
export function warsawDate(instant: Date): string {
  const offsetHours = warsawUtcOffsetHours(instant);
  const date = new Date(instant.getTime() + offsetHours * 3_600_000).toISOString().slice(0, 10);
  assertRateDate(date);
  return date;
}

/** Europe/Warsaw's UTC offset at an instant under the EU rule documented on {@link warsawDate}: 2 (CEST) or 1 (CET). */
export function warsawUtcOffsetHours(instant: Date): 1 | 2 {
  const time = instant.getTime();
  if (Number.isNaN(time)) throw new RangeError("invalid-instant");
  const year = instant.getUTCFullYear();
  return time >= lastSundayAt0100Utc(year, 2) && time < lastSundayAt0100Utc(year, 9) ? 2 : 1;
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
  assertRateDate(from);
  assertRateDate(to);
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
  assertRateDate(effectiveDate);
  assertRateDate(today);
  const todayNumber = toDayNumber(today);
  return (
    businessDaysBetween(effectiveDate, today) > 0 ||
    (todayNumber > toDayNumber(effectiveDate) && isBusinessDay(todayNumber))
  );
}

/**
 * A quote is stale when at least `maxAgeBusinessDays` business days (Mon–Fri, no holidays) lie strictly between
 * its effective date and today, i.e. when the effective date is older than `maxAgeBusinessDays` business days
 * before today. Applies to NBP and manual quotes alike; `today` is the Warsaw date ({@link warsawDate}), never a clock.
 */
export function isRateStale(
  effectiveDate: string,
  today: string,
  maxAgeBusinessDays: number,
): boolean {
  assertFreshnessThreshold(maxAgeBusinessDays);
  return businessDaysBetween(effectiveDate, today) >= maxAgeBusinessDays;
}
