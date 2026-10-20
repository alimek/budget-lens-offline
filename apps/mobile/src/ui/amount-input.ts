import {
  type CurrencyCode,
  type MinorUnits,
  type ParseMoneyError,
  parseMoney,
} from "@budget-lens/core";

/** i18n keys of the amount field errors, one per `parseMoney` error code. */
const ERROR_KEYS = {
  empty: "amountInput.empty",
  "invalid-format": "amountInput.invalidFormat",
  "too-many-fraction-digits": "amountInput.tooManyFractionDigits",
  "out-of-range": "amountInput.outOfRange",
} as const satisfies Record<ParseMoneyError, string>;

export type AmountInputErrorKey = (typeof ERROR_KEYS)[ParseMoneyError];

export type AmountInputResult =
  | { readonly ok: true; readonly value: MinorUnits }
  | { readonly ok: false; readonly errorKey: AmountInputErrorKey };

/** Validates what the user typed in an amount field: minor units, or the i18n key of the message to show. */
export function validateAmountInput(text: string, currency: CurrencyCode): AmountInputResult {
  const result = parseMoney(text, { currency });
  return result.ok ? result : { ok: false, errorKey: ERROR_KEYS[result.error] };
}
