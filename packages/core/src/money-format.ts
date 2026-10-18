import { type MinorUnits, toMinorUnits } from "./money";

const MINOR_UNITS_PER_UNIT = 100n;
const MINOR_UNIT_DIGITS = 2;

export interface FormatMoneyOptions {
  /** BCP 47 locale, e.g. `"pl-PL"` or `"en"`. */
  readonly locale: string;
  /**
   * ISO 4217 currency code, e.g. `"PLN"`. Used for display only (symbol and its position): the amount is always
   * treated as 1/100 of the unit, so `JPY` 1234 is shown as `¥12.34`. The currency model is researched in #39.
   */
  readonly currency: string;
  /** Fraction digits to show: 2 (default) or 0 (legacy `formatCurrency` behaviour, rounded half away from zero). */
  readonly fractionDigits?: 0 | 2;
}

/**
 * Formats an amount of minor units (1/100 of the currency unit) as a localized currency string, e.g.
 * `formatMoney(toMinorUnits(123456), { locale: "pl-PL", currency: "PLN" })` → `"1234,56 zł"`.
 * The amount is passed to `Intl` as an exact decimal string, so every safe integer is formatted exactly.
 */
export function formatMoney(amount: MinorUnits, options: FormatMoneyOptions): string {
  const fractionDigits = options.fractionDigits ?? 2;
  return new Intl.NumberFormat(options.locale, {
    style: "currency",
    currency: options.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(toDecimalString(amount));
}

export interface FormatMoneyCompactOptions {
  /** BCP 47 locale, e.g. `"pl-PL"` or `"en"`. */
  readonly locale: string;
}

/**
 * Formats an amount of minor units in the locale's compact notation without a currency symbol, e.g.
 * `500000` (5000 zł) → `"5 tys."` in `pl-PL` and `"5K"` in `en`. Negative amounts are compacted too.
 */
export function formatMoneyCompact(amount: MinorUnits, options: FormatMoneyCompactOptions): string {
  return new Intl.NumberFormat(options.locale, { notation: "compact" }).format(
    toDecimalString(amount),
  );
}

/**
 * Exact decimal string of an amount in major units, e.g. `-123456` → `"-1234.56"`. `Intl.NumberFormat` formats
 * such a string as an exact decimal (ES2023), whereas `amount / 100` loses the last digit above about 2^46.
 */
function toDecimalString(amount: MinorUnits): Intl.StringNumericLiteral {
  const value = BigInt(toMinorUnits(amount));
  const absolute = value < 0n ? -value : value;
  const units = absolute / MINOR_UNITS_PER_UNIT;
  const fraction = String(absolute % MINOR_UNITS_PER_UNIT).padStart(MINOR_UNIT_DIGITS, "0");
  // The template has the `${number}` shape that `Intl.StringNumericLiteral` describes; TS cannot infer it.
  return `${value < 0n ? "-" : ""}${units}.${fraction}` as Intl.StringNumericLiteral;
}
