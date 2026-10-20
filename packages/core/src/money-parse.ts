import { type CurrencyCode, currencyExponent } from "./currency";
import { type MinorUnits, toMinorUnits } from "./money";

/** Why {@link parseMoney} rejected an input. Codes only; the UI translates them. */
export type ParseMoneyError =
  | "empty"
  | "invalid-format"
  | "too-many-fraction-digits"
  | "out-of-range";

export type ParseMoneyResult =
  | { readonly ok: true; readonly value: MinorUnits }
  | { readonly ok: false; readonly error: ParseMoneyError };

const MINUS_SIGNS = ["-", "\u2212"];
/** Grouping spaces: space, no-break space and narrow no-break space. Tabs and line breaks are not grouping. */
const SPACES = /[ \u00a0\u202f]/g;
/** Fraction digits accepted when no currency is given (the exponent of PLN, EUR, USD and most others). */
const DEFAULT_FRACTION_DIGITS = 2;

export interface ParseMoneyOptions {
  /**
   * Currency of the amount. Its ISO 4217 exponent is the maximum number of fraction digits and the scale of the
   * result: `"12,5"` is 1250 for PLN and `too-many-fraction-digits` for JPY. Without it, 2 fraction digits.
   */
  readonly currency?: CurrencyCode;
}

/**
 * Parses a user-entered amount (major units, e.g. złoty) into minor units without floating-point arithmetic.
 *
 * Accepted: an optional leading minus, digits, at most as many fraction digits as the currency's exponent (2 by
 * default, see {@link ParseMoneyOptions}) after a decimal comma or dot, and
 * thousands grouping with spaces (including no-break spaces) or with the separator that is not the decimal one:
 * `"1 234,56"`, `"1234.5"`, `"-12"`, `"1.234,56"`, `"1,234.56"`, `"1.234.567"`.
 * A single `,` or `.` is the decimal separator, so `"1,234"` is rejected (3 fraction digits) instead of being
 * guessed. The exception is a currency without minor digits (exponent 0: CLP, ISK, JPY, KRW): there a single `,` or
 * `.` followed by exactly 3 digits is a thousands separator (`"1,000"` is 1000 JPY, #164), since such a currency has
 * no fraction digits at all. Currency symbols, letters, a leading `+`, a missing integer part (`",5"`), tabs or line breaks
 * inside the number and malformed grouping are rejected.
 */
export function parseMoney(input: string, options: ParseMoneyOptions = {}): ParseMoneyResult {
  const maxFractionDigits =
    options.currency === undefined ? DEFAULT_FRACTION_DIGITS : currencyExponent(options.currency);
  let text = input.trim();
  if (text === "") {
    return { ok: false, error: "empty" };
  }
  const negative = MINUS_SIGNS.some((sign) => text.startsWith(sign));
  if (negative) {
    text = text.slice(1);
  }
  text = text.replace(SPACES, " ");
  if (!/^\d[\d .,]*$/.test(text)) {
    return { ok: false, error: "invalid-format" };
  }

  const decimalSeparator = findDecimalSeparator(text);
  if (decimalSeparator === undefined) {
    return { ok: false, error: "invalid-format" };
  }
  const decimalIndex =
    decimalSeparator === "" || isThousandsSeparator(text, decimalSeparator, maxFractionDigits)
      ? -1
      : text.lastIndexOf(decimalSeparator);
  const integerPart = decimalIndex === -1 ? text : text.slice(0, decimalIndex);
  const fractionPart = decimalIndex === -1 ? "" : text.slice(decimalIndex + 1);

  if (decimalIndex !== -1 && !/^\d+$/.test(fractionPart)) {
    return { ok: false, error: "invalid-format" };
  }
  if (fractionPart.length > maxFractionDigits) {
    return { ok: false, error: "too-many-fraction-digits" };
  }
  const integerDigits = ungroup(integerPart);
  if (integerDigits === undefined) {
    return { ok: false, error: "invalid-format" };
  }

  const minor = BigInt(integerDigits + fractionPart.padEnd(maxFractionDigits, "0"));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) {
    return { ok: false, error: "out-of-range" };
  }
  const value = Number(minor);
  return { ok: true, value: toMinorUnits(negative ? -value : value) };
}

/** `","` or `"."`, `""` when there is no decimal part, `undefined` when the separators are inconsistent. */
function findDecimalSeparator(text: string): "," | "." | "" | undefined {
  const commas = text.split(",").length - 1;
  const dots = text.split(".").length - 1;
  if (commas > 0 && dots > 0) {
    const last = text.lastIndexOf(",") > text.lastIndexOf(".") ? "," : ".";
    return (last === "," ? commas : dots) === 1 ? last : undefined;
  }
  if (commas === 1) return ",";
  if (dots === 1) return ".";
  return "";
}

/**
 * Whether the single `,` or `.` of `text` groups thousands instead of starting the fraction: only in a currency
 * without minor digits, and only when exactly 3 digits follow it (#164).
 */
function isThousandsSeparator(
  text: string,
  separator: "," | ".",
  maxFractionDigits: number,
): boolean {
  return maxFractionDigits === 0 && /^\d{3}$/.test(text.slice(text.lastIndexOf(separator) + 1));
}

/** Digits of the integer part with valid thousands grouping removed, `undefined` for malformed grouping. */
function ungroup(integerPart: string): string | undefined {
  if (/^\d+$/.test(integerPart)) {
    return integerPart;
  }
  const separators = new Set(integerPart.replace(/\d/g, ""));
  const [separator] = separators;
  if (separators.size !== 1 || separator === undefined) {
    return undefined;
  }
  const groups = integerPart.split(separator);
  const [first = "", ...rest] = groups;
  const valid = /^\d{1,3}$/.test(first) && rest.every((group) => /^\d{3}$/.test(group));
  return valid ? groups.join("") : undefined;
}
