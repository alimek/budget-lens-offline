import { type CurrencyCode, currencyExponent } from "./currency";
import { type MinorUnits, toMinorUnits } from "./money";

/** A positive decimal PLN price per one major unit, with at most 12 fraction digits. */
function decimalRate(rate: string): { value: bigint; scale: bigint } {
  if (typeof rate !== "string" || !/^\d+(?:\.\d{1,12})?$/.test(rate)) {
    throw new RangeError("invalid-rate");
  }
  const [whole = "", fraction = ""] = rate.split(".");
  const value = BigInt(whole + fraction);
  if (value === 0n) {
    throw new RangeError("invalid-rate");
  }
  return { value, scale: 10n ** BigInt(fraction.length) };
}

/**
 * Converts through PLN with one rounding, half away from zero. Rates are decimal strings in PLN per major unit;
 * PLN is implicit and identity needs no rate. No intermediate PLN amount is rounded (#124).
 * Throws RangeError for invalid inputs, a missing/invalid rate or an unsafe result.
 */
export function convertMinor(
  amount: MinorUnits,
  from: CurrencyCode,
  to: CurrencyCode,
  rate: (currency: CurrencyCode) => string | undefined,
): MinorUnits {
  const value = BigInt(toMinorUnits(amount));
  const fromExponent = currencyExponent(from);
  const toExponent = currencyExponent(to);
  if (from === to) {
    return toMinorUnits(amount);
  }
  const leg = (currency: CurrencyCode) => {
    const mid = currency === "PLN" ? "1" : rate(currency);
    if (mid === undefined) {
      throw new RangeError("missing-rate");
    }
    return decimalRate(mid);
  };
  const source = leg(from);
  const target = leg(to);
  const numerator = value * source.value * target.scale * 10n ** BigInt(toExponent);
  const denominator = target.value * source.scale * 10n ** BigInt(fromExponent);
  let rounded = numerator / denominator;
  const remainder = numerator % denominator;
  if ((remainder < 0n ? -remainder : remainder) * 2n >= denominator) {
    rounded += numerator < 0n ? -1n : 1n;
  }
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER) || rounded < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError("amount-overflow");
  }
  return toMinorUnits(Number(rounded));
}
