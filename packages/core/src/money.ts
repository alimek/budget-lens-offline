/**
 * Monetary amount expressed in minor currency units (e.g. 1 PLN = 100 minor units).
 * Always an integer, which avoids floating-point rounding errors.
 */
export type MinorUnits = number;

export function isMinorUnits(value: number): value is MinorUnits {
  return Number.isSafeInteger(value);
}

export function sumMinorUnits(amounts: readonly MinorUnits[]): MinorUnits {
  let total = 0;
  for (const amount of amounts) {
    if (!isMinorUnits(amount)) {
      throw new RangeError(`Amount must be an integer number of minor units, received: ${amount}`);
    }
    total += amount;
  }
  if (!isMinorUnits(total)) {
    throw new RangeError("Sum exceeds the safe integer range");
  }
  return total;
}
