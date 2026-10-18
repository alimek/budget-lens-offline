import { type CurrencyCode, currencyExponent } from "./currency";
import { type MinorUnits, toMinorUnits } from "./money";
import { LOCALE_DATA, type LocaleData } from "./money-locale";
import type { Language } from "./settings";

/** CLDR compact patterns group only numbers with at least 2 digits in the leading group. */
const COMPACT_MINIMUM_GROUPING_DIGITS = 2;

export interface FormatMoneyOptions {
  /** App language, `"pl"` or `"en"` (#38): the `Language` of `Settings`, with `"system"` resolved by the app. */
  readonly lang: Language;
  /** ISO 4217 code. Its exponent (2 for PLN, 0 for JPY) says how many minor units make one unit. */
  readonly currency: CurrencyCode;
  /**
   * `"currency"` (default): the currency's fraction digits (2 for PLN). `0`: whole units, rounded half away from
   * zero, like the legacy `formatCurrency`. An amount that rounds to 0 has no minus sign (`-0,49 zł` → `0 zł`).
   */
  readonly fractionDigits?: "currency" | 0;
}

/**
 * Formats an amount of minor units as a currency string with CLDR conventions for `pl` and `en`, without `Intl`
 * and without floats, e.g. `formatMoney(toMinorUnits(123456), { lang: "pl", currency: "PLN" })` →
 * `"1234,56 zł"` (with a no-break space before `zł`). The output is the same on every runtime.
 */
export function formatMoney(amount: MinorUnits, options: FormatMoneyOptions): string {
  const locale = LOCALE_DATA[options.lang];
  const exponent = currencyExponent(options.currency);
  const fractionDigits = options.fractionDigits === 0 ? 0 : exponent;
  const value = BigInt(toMinorUnits(amount));
  const rounded = roundHalfAwayFromZero(abs(value), exponent - fractionDigits);
  const number = formatDecimal(locale, rounded, fractionDigits, locale.minimumGroupingDigits);
  const symbol = locale.currencySymbols[options.currency];
  const label = symbol ?? options.currency;
  const spacing = symbol === undefined ? locale.codeSpacing : locale.symbolSpacing;
  const body =
    locale.currencyPosition === "before"
      ? `${label}${spacing}${number}`
      : `${number}${spacing}${label}`;
  return withSign(value, rounded, body);
}

export interface FormatMoneyCompactOptions {
  /** App language, `"pl"` or `"en"` (#38): the `Language` of `Settings`, with `"system"` resolved by the app. */
  readonly lang: Language;
  /** ISO 4217 code; only its exponent is used, the output has no currency symbol. */
  readonly currency: CurrencyCode;
}

/**
 * Formats an amount of minor units in CLDR compact notation without a currency symbol, e.g. 5000 zł →
 * `"5 tys."` (`pl`, no-break space) or `"5K"` (`en`); negative amounts are compacted too. Rounding follows CLDR
 * compact defaults: 2 significant digits below 10 (`1,5 mln`), whole numbers from 10 (`12 tys.`), half away from
 * zero, and a result that rounds up to 1000 moves to the next suffix (999 999 zł → `1 mln`).
 */
export function formatMoneyCompact(amount: MinorUnits, options: FormatMoneyCompactOptions): string {
  const locale = LOCALE_DATA[options.lang];
  const exponent = currencyExponent(options.currency);
  const value = BigInt(toMinorUnits(amount));
  const absolute = abs(value);
  const suffixes = locale.compactSuffixes;
  let index = -1;
  while (
    index < suffixes.length - 1 &&
    absolute >= 10n ** BigInt(exponent + nextPower(suffixes, index))
  ) {
    index += 1;
  }
  for (;;) {
    const scale = exponent + (suffixes[index]?.power ?? 0);
    const integerDigits = String(absolute).length - scale;
    const fractionDigits = Math.min(Math.max(2 - integerDigits, 0), scale);
    const rounded = roundHalfAwayFromZero(absolute, scale - fractionDigits);
    if (index < suffixes.length - 1 && rounded >= 1000n * 10n ** BigInt(fractionDigits)) {
      index += 1;
      continue;
    }
    const number = formatDecimal(
      locale,
      rounded,
      fractionDigits,
      COMPACT_MINIMUM_GROUPING_DIGITS,
      true,
    );
    const suffix = suffixes[index];
    const body =
      suffix === undefined ? number : `${number}${locale.compactSpacing}${suffix.suffix}`;
    return withSign(value, rounded, body);
  }
}

function nextPower(suffixes: LocaleData["compactSuffixes"], index: number): number {
  return suffixes[index + 1]?.power ?? Number.POSITIVE_INFINITY;
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

/** `value / 10^digits` for a non-negative `value`, rounded half away from zero. */
function roundHalfAwayFromZero(value: bigint, digits: number): bigint {
  const divisor = 10n ** BigInt(digits);
  const quotient = value / divisor;
  return (value % divisor) * 2n >= divisor ? quotient + 1n : quotient;
}

/** Minus sign (ASCII `-` in CLDR `pl` and `en`) only when the shown amount is not 0. */
function withSign(value: bigint, rounded: bigint, body: string): string {
  return value < 0n && rounded !== 0n ? `-${body}` : body;
}

/** Digits of `scaled / 10^fractionDigits` with the locale's separators; `trimZeros` drops trailing fraction zeros. */
function formatDecimal(
  locale: LocaleData,
  scaled: bigint,
  fractionDigits: number,
  minimumGroupingDigits: number,
  trimZeros = false,
): string {
  const digits = String(scaled).padStart(fractionDigits + 1, "0");
  const integerPart = digits.slice(0, digits.length - fractionDigits);
  let fractionPart = digits.slice(digits.length - fractionDigits);
  if (trimZeros) {
    fractionPart = fractionPart.replace(/0+$/, "");
  }
  const grouped = group(integerPart, locale.groupSeparator, minimumGroupingDigits);
  return fractionPart === "" ? grouped : `${grouped}${locale.decimalSeparator}${fractionPart}`;
}

/** Groups by thousands, but only when the leading group would have at least `minimumGroupingDigits` digits. */
function group(integerPart: string, separator: string, minimumGroupingDigits: number): string {
  if (integerPart.length < 3 + minimumGroupingDigits) {
    return integerPart;
  }
  return integerPart.replace(/\B(?=(\d{3})+$)/g, separator);
}
