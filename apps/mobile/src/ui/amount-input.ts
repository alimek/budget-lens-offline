import {
  type CurrencyCode,
  currencyExponent,
  type MinorUnits,
  type ParseMoneyError,
  parseMoney,
} from "@budget-lens/core";

/**
 * i18n keys of the amount field errors, one per `parseMoney` error code.
 * `too-many-fraction-digits` splits by the currency's exponent (#61): a currency that has fraction digits gets the
 * plural `amountInput.tooManyFractionDigits` (its `count` is the exponent), and one that has none at all gets
 * `amountInput.noFractionDigits`, which says so by currency instead of by a number of decimal places the user
 * cannot have.
 */
const ERROR_KEYS = {
  empty: "amountInput.empty",
  "invalid-format": "amountInput.invalidFormat",
  "too-many-fraction-digits": "amountInput.tooManyFractionDigits",
  "out-of-range": "amountInput.outOfRange",
} as const satisfies Record<ParseMoneyError, string>;

/** The key of a rejected amount; `amountInput.noFractionDigits` is the exponent-0 case of the fraction rule. */
export type AmountInputErrorKey =
  | (typeof ERROR_KEYS)[ParseMoneyError]
  | "amountInput.noFractionDigits";

export type AmountInputResult =
  | { readonly ok: true; readonly value: MinorUnits }
  | { readonly ok: false; readonly errorKey: AmountInputErrorKey };

/**
 * Validates what the user typed in an amount field: minor units, or the i18n key of the message to show. The key
 * alone is not the whole message: `amountInput.tooManyFractionDigits` takes `count` and
 * `amountInput.noFractionDigits` takes `currency`, both of which the field knows from its own currency.
 */
export function validateAmountInput(text: string, currency: CurrencyCode): AmountInputResult {
  const result = parseMoney(text, { currency });
  if (result.ok) {
    return result;
  }
  if (result.error === "too-many-fraction-digits" && currencyExponent(currency) === 0) {
    return { ok: false, errorKey: "amountInput.noFractionDigits" };
  }
  return { ok: false, errorKey: ERROR_KEYS[result.error] };
}

/**
 * The zero of a currency written the way the app language writes it, which is the placeholder of an empty field
 * (#61): "0.00" in English, "0,00" in Polish, "0" for a currency without minor digits. The caller passes the
 * formatter of its own language and currency, so this stays free of locale knowledge.
 */
export function amountInputPlaceholder(format: (amount: MinorUnits) => string): string {
  return format(0 as MinorUnits);
}

/**
 * What an amount field does with its text when it loses focus (#61, decision 2): a value the currency can hold is
 * rewritten as `format` writes it, and anything else is left exactly as typed, so the user sees and fixes the
 * text they actually entered rather than losing it to a rewrite. The field never rewrites while it is focused.
 */
export function reformatAmountOnBlur(
  text: string,
  currency: CurrencyCode,
  format: (amount: MinorUnits) => string,
): string {
  const amount = validateAmountInput(text, currency);
  return amount.ok ? format(amount.value) : text;
}
