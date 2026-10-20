import {
  type CurrencyCode,
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
