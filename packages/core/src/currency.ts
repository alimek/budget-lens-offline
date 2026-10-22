/**
 * ISO 4217 minor-unit exponents (number of fraction digits of the currency), from the SIX ISO 4217 "List One"
 * published 2026-09-17 (#39). The table holds PLN and the currencies of NBP table A except XDR, which has no
 * minor unit. A `MinorUnits` amount is interpreted with the exponent of its currency: 123 PLN minor units are
 * 1,23 zł, 123 JPY minor units are ¥123.
 */
const CURRENCY_EXPONENTS = {
  AUD: 2,
  BRL: 2,
  CAD: 2,
  CHF: 2,
  CLP: 0,
  CNY: 2,
  CZK: 2,
  DKK: 2,
  EUR: 2,
  GBP: 2,
  HKD: 2,
  HUF: 2,
  IDR: 2,
  ILS: 2,
  INR: 2,
  ISK: 0,
  JPY: 0,
  KRW: 0,
  MXN: 2,
  MYR: 2,
  NOK: 2,
  NZD: 2,
  PHP: 2,
  PLN: 2,
  RON: 2,
  SEK: 2,
  SGD: 2,
  THB: 2,
  TRY: 2,
  UAH: 2,
  USD: 2,
  ZAR: 2,
} as const satisfies Record<string, number>;

/** ISO 4217 code of a currency known to `packages/core`, e.g. `"PLN"`. */
export type CurrencyCode = keyof typeof CURRENCY_EXPONENTS;

/**
 * Every supported currency code, sorted A–Z: the list a currency picker starts from (#61). The table above is
 * already in that order, so this is its keys; a picker that wants another order sorts or moves entries itself.
 */
export const CURRENCY_CODES: readonly CurrencyCode[] = Object.keys(
  CURRENCY_EXPONENTS,
) as CurrencyCode[];

/**
 * Whether `value` is a supported currency code: PLN or an NBP table A currency except XDR (owner decision on #117).
 * Use it to narrow an unchecked code (e.g. from storage) before formatting or parsing.
 */
export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && Object.hasOwn(CURRENCY_EXPONENTS, value);
}

/**
 * Minor-unit exponent of a currency: 2 for PLN (1 zł = 100 groszy), 0 for JPY.
 * Throws a `RangeError` for a code outside the table (e.g. an unchecked string read from storage).
 */
export function currencyExponent(currency: CurrencyCode): number {
  if (!isCurrencyCode(currency)) {
    throw new RangeError(`Unsupported currency: ${currency}`);
  }
  return CURRENCY_EXPONENTS[currency];
}
