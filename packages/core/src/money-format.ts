import { type MinorUnits, toMinorUnits } from "./money";

const MINOR_UNITS_PER_UNIT = 100;

export interface FormatMoneyOptions {
  /** BCP 47 locale, e.g. `"pl-PL"` or `"en"`. */
  readonly locale: string;
  /** ISO 4217 currency code, e.g. `"PLN"`. */
  readonly currency: string;
  /** Fraction digits to show: 2 (default) or 0 (legacy `formatCurrency` behaviour, rounded half away from zero). */
  readonly fractionDigits?: 0 | 2;
}

/**
 * Formats an amount of minor units (1/100 of the currency unit) as a localized currency string, e.g.
 * `formatMoney(toMinorUnits(123456), { locale: "pl-PL", currency: "PLN" })` → `"1234,56 zł"`.
 */
export function formatMoney(amount: MinorUnits, options: FormatMoneyOptions): string {
  const fractionDigits = options.fractionDigits ?? 2;
  return new Intl.NumberFormat(options.locale, {
    style: "currency",
    currency: options.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(toMinorUnits(amount) / MINOR_UNITS_PER_UNIT);
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
    toMinorUnits(amount) / MINOR_UNITS_PER_UNIT,
  );
}
