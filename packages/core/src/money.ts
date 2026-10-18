/**
 * Monetary amount expressed in minor currency units (e.g. 1 PLN = 100 minor units).
 * Always a safe integer, which avoids floating-point rounding errors.
 *
 * Branded so that plain numbers cannot be used as amounts by accident;
 * create values with {@link toMinorUnits} or narrow them with {@link isMinorUnits}.
 */
export type MinorUnits = number & { readonly __brand: "MinorUnits" };

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
      throw new RangeError("Sum exceeds the safe integer range");
    }
  }
  return toMinorUnits(total);
}
