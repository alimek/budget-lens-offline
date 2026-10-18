import { type CurrencyCode, currencyExponent } from "./currency";
import { type MinorUnits, toMinorUnits } from "./money";
import type { Language } from "./settings";

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

/** Formats full currency amounts with native Intl; symbols, spacing and grouping depend on the platform. */
export function formatMoney(amount: MinorUnits, options: FormatMoneyOptions): string {
  const exponent = currencyExponent(options.currency);
  const fractionDigits = options.fractionDigits === 0 ? 0 : exponent;
  const value = BigInt(toMinorUnits(amount));
  const scale = 10n ** BigInt(exponent);
  let major: number;
  if (fractionDigits === 0) {
    const absolute = value < 0n ? -value : value;
    const rounded = absolute / scale + ((absolute % scale) * 2n >= scale ? 1n : 0n);
    major = Number(value < 0n ? -rounded : rounded);
  } else {
    // Native Hermes Intl takes a number; floating-point conversion is confined to display.
    major = Number(value) / Number(scale);
  }
  return new Intl.NumberFormat(options.lang === "pl" ? "pl-PL" : "en-GB", {
    style: "currency",
    currency: options.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(major === 0 ? 0 : major);
}
