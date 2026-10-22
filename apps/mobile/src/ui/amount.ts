import {
  type CurrencyCode,
  currencyExponent,
  formatMoney,
  type Language,
  type MinorUnits,
  negateMinorUnits,
} from "@budget-lens/core";

/** Colour role of an amount: `income` for positive, `expense` for negative, `neutral` for zero. */
export type AmountTone = "income" | "expense" | "neutral";

/** `auto`: only negative amounts get a sign. `always`: positive amounts also get `+` (zero never does). */
export type AmountSign = "auto" | "always";

export interface FormatAmountOptions {
  readonly lang: Language;
  readonly currency: CurrencyCode;
  readonly sign?: AmountSign;
}

export interface FormattedAmount {
  readonly text: string;
  readonly tone: AmountTone;
}

/** The real minus sign (U+2212) used for negative amounts, as in the #58 spec. */
const MINUS = "\u2212";

/**
 * Formats integer minor units for display with `Intl` (via `formatMoney`), a `+` / `−` sign and the colour role,
 * so colour is never the only signal.
 */
export function formatAmount(amount: MinorUnits, options: FormatAmountOptions): FormattedAmount {
  const { lang, currency, sign = "auto" } = options;
  const magnitude = formatMoney(amount < 0 ? negateMinorUnits(amount) : amount, { lang, currency });
  if (amount < 0) return { text: `${MINUS}${magnitude}`, tone: "expense" };
  if (amount > 0) return { text: sign === "always" ? `+${magnitude}` : magnitude, tone: "income" };
  return { text: magnitude, tone: "neutral" };
}

/** The colour token of an amount tone, for native views that take a colour instead of a class. */
export function toneColorToken(tone: AmountTone): "income" | "expense" | "foreground" {
  return tone === "neutral" ? "foreground" : tone;
}

/**
 * The amount as a plain number for an amount *field* (#61): grouping and fraction digits of the app language and
 * the currency's exponent, but no currency symbol, because the field shows the currency in its own control.
 * `123456` grosze is `1 234,56` in Polish and `1,234.56` in English; `12000` yen is `12 000` / `12,000`. This is
 * what the field shows when it loses focus, and `parseMoney` reads the grouping back. Like `formatMoney`, the
 * minor units reach `Intl` as a number only for display; a currency without minor digits is rounded to whole
 * units first, so no fraction digits appear where the currency has none.
 */
export function formatAmountNumber(
  amount: MinorUnits,
  options: { readonly lang: Language; readonly currency: CurrencyCode },
): string {
  const exponent = currencyExponent(options.currency);
  const scale = 10 ** exponent;
  const major =
    exponent === 0
      ? Math.round((amount < 0 ? negateMinorUnits(amount) : amount) / scale) * (amount < 0 ? -1 : 1)
      : amount / scale;
  return new Intl.NumberFormat(options.lang === "pl" ? "pl-PL" : "en-GB", {
    style: "decimal",
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(major === 0 ? 0 : major);
}
