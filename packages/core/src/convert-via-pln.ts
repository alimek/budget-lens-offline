import type { CurrencyCode } from "./currency";
import { convertMinor, convertMinorExact, type MinorUnits } from "./money";

/** Selects PLN-quoted decimal legs; exact scaling and the single final rounding live in money.ts. */
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
