import { type CurrencyCode, currencyExponent } from "./currency";

/**
 * Monetary amount expressed in minor currency units (e.g. 1 PLN = 100 minor units).
 * Always a safe integer, which avoids floating-point rounding errors.
 *
 * Branded so that plain numbers cannot be used as amounts by accident;
 * create values with {@link toMinorUnits} or narrow them with {@link isMinorUnits}.
 */
export type MinorUnits = number & { readonly __brand: "MinorUnits" };

/** A valid money operation whose result leaves the safe-integer range. */
export class MoneyOverflowError extends RangeError {}

export function isMinorUnits(value: number): value is MinorUnits {
  return Number.isSafeInteger(value);
}

/**
 * Converts a number to {@link MinorUnits}.
 * Throws a `RangeError` when the value is not a safe integer. `-0` is normalized to `0`.
 */
export function toMinorUnits(value: number): MinorUnits {
  if (!isMinorUnits(value)) {
    throw new RangeError(`Amount must be a safe integer number of minor units, received: ${value}`);
  }
  return (value === 0 ? 0 : value) as MinorUnits;
}

/**
 * Sums amounts without mutating the input.
 * Throws a `RangeError` for an invalid amount or as soon as any partial sum
 * leaves the safe integer range (overflow or underflow).
 */
export function sumMinorUnits(amounts: readonly MinorUnits[]): MinorUnits {
  let total = 0;
  for (const amount of amounts) {
    total += toMinorUnits(amount);
    if (!Number.isSafeInteger(total)) {
      throw new MoneyOverflowError("Sum exceeds the safe integer range");
    }
  }
  return toMinorUnits(total);
}

/** Adds two amounts. Throws a `RangeError` when the result leaves the safe integer range. */
export function addMinorUnits(a: MinorUnits, b: MinorUnits): MinorUnits {
  return sumMinorUnits([a, b]);
}

/** Subtracts `b` from `a`. Throws a `RangeError` when the result leaves the safe integer range. */
export function subtractMinorUnits(a: MinorUnits, b: MinorUnits): MinorUnits {
  return sumMinorUnits([a, negateMinorUnits(b)]);
}

export function negateMinorUnits(amount: MinorUnits): MinorUnits {
  return toMinorUnits(-toMinorUnits(amount));
}

/**
 * Multiplies an amount by a rate (e.g. an NBP exchange rate per 1 unit of the currency) and rounds the result
 * to whole minor units **half away from zero** (0.5 → 1, -0.5 → -1). The rate is used as the decimal number it
 * prints as (`String(rate)`), so `0.024574` is exactly 24574 / 10^6 and the product is computed without
 * floating-point error.
 *
 * Throws a `RangeError` for a negative or non-finite rate and when the result leaves the safe integer range.
 */
export function multiplyByRate(amount: MinorUnits, rate: number): MinorUnits {
  return multiplyAtScale(amount, checkedRate(rate), "1", 0);
}

/** Converts between currency minor-unit scales, rounding only once, half away from zero. */
export function convertMinor(
  amount: MinorUnits,
  rate: number,
  source: CurrencyCode,
  target: CurrencyCode,
): MinorUnits {
  return convertMinorExact(amount, checkedRate(rate), "1", source, target);
}

/**
 * Exact decimal-string ratio: sourceRate / targetRate major units, with one final rounding.
 * Both rates use the same quote currency (e.g. PLN); no intermediate cross-rate or amount is rounded.
 * sourceRate may be zero; targetRate must be positive. Decimal exponent notation is accepted.
 */
export function convertMinorExact(
  amount: MinorUnits,
  sourceRate: string,
  targetRate: string,
  source: CurrencyCode,
  target: CurrencyCode,
): MinorUnits {
  return multiplyAtScale(
    amount,
    sourceRate,
    targetRate,
    currencyExponent(target) - currencyExponent(source),
  );
}

/** Selects PLN-quoted decimal legs for {@link convertMinorExact}; both legs share its single final rounding. */
export function convertViaPln(
  amount: MinorUnits,
  from: CurrencyCode,
  to: CurrencyCode,
  rate: (currency: CurrencyCode) => string | undefined,
): MinorUnits {
  if (from === to) return convertMinor(amount, 1, from, to);
  const leg = (currency: CurrencyCode): string => {
    const mid = currency === "PLN" ? "1" : rate(currency);
    if (mid === undefined) throw new RangeError("missing-rate");
    if (typeof mid !== "string" || !/^\d+(?:\.\d{1,12})?$/.test(mid) || !/[1-9]/.test(mid)) {
      throw new RangeError("invalid-rate");
    }
    return mid;
  };
  return convertMinorExact(amount, leg(from), leg(to), from, to);
}

function checkedRate(rate: number): string {
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError(`Rate must be a finite, non-negative number, received: ${rate}`);
  }
  return String(rate);
}

function multiplyAtScale(
  amount: MinorUnits,
  sourceRate: string,
  targetRate: string,
  exponentShift: number,
): MinorUnits {
  const value = BigInt(toMinorUnits(amount));
  const source = toDecimal(sourceRate);
  const target = toDecimal(targetRate);
  if (target.coefficient === 0n) throw new RangeError("invalid-rate");
  const product =
    value * source.coefficient * 10n ** (target.scale + BigInt(Math.max(exponentShift, 0)));
  const divisor = target.coefficient * 10n ** (source.scale + BigInt(Math.max(-exponentShift, 0)));
  let result = product / divisor;
  const remainder = product % divisor;
  const absRemainder = remainder < 0n ? -remainder : remainder;
  if (absRemainder * 2n >= divisor) {
    result += product < 0n ? -1n : 1n;
  }
  if (result > BigInt(Number.MAX_SAFE_INTEGER) || result < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new MoneyOverflowError("Result exceeds the safe integer range");
  }
  return toMinorUnits(Number(result));
}

/** Exact decimal value of a finite, non-negative number as `coefficient / 10^scale`. */
function toDecimal(rate: string): { coefficient: bigint; scale: bigint } {
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(rate);
  if (!match) {
    throw new RangeError(`Unsupported rate: ${rate}`);
  }
  const [, integerDigits = "", fractionDigits = "", exponent = "0"] = match;
  const coefficient = BigInt(integerDigits + fractionDigits);
  const power = Number(exponent) - fractionDigits.length;
  return power >= 0
    ? { coefficient: coefficient * 10n ** BigInt(power), scale: 0n }
    : { coefficient, scale: BigInt(-power) };
}
