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
const MAX_FRACTION_DIGITS = 2;

/**
 * Parses a user-entered amount (major units, e.g. złoty) into minor units without floating-point arithmetic.
 *
 * Accepted: an optional leading minus, digits, at most 2 fraction digits after a decimal comma or dot, and
 * thousands grouping with spaces (including no-break spaces) or with the separator that is not the decimal one:
 * `"1 234,56"`, `"1234.5"`, `"-12"`, `"1.234,56"`, `"1,234.56"`, `"1.234.567"`.
 * A single `,` or `.` is always the decimal separator, so `"1,234"` is rejected (3 fraction digits) instead of
 * being guessed. Currency symbols, letters, a leading `+`, a missing integer part (`",5"`), tabs or line breaks
 * inside the number and malformed grouping are rejected.
 */
export function parseMoney(input: string): ParseMoneyResult {
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
  const decimalIndex = decimalSeparator === "" ? -1 : text.lastIndexOf(decimalSeparator);
  const integerPart = decimalIndex === -1 ? text : text.slice(0, decimalIndex);
  const fractionPart = decimalIndex === -1 ? "" : text.slice(decimalIndex + 1);

  if (decimalIndex !== -1 && !/^\d+$/.test(fractionPart)) {
    return { ok: false, error: "invalid-format" };
  }
  if (fractionPart.length > MAX_FRACTION_DIGITS) {
    return { ok: false, error: "too-many-fraction-digits" };
  }
  const integerDigits = ungroup(integerPart);
  if (integerDigits === undefined) {
    return { ok: false, error: "invalid-format" };
  }

  const minor = BigInt(integerDigits + fractionPart.padEnd(MAX_FRACTION_DIGITS, "0"));
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
