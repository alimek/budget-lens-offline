/**
 * Kwota pieniężna w groszach (1 PLN = 100 groszy).
 * Zawsze liczba całkowita – unikamy błędów zaokrągleń liczb zmiennoprzecinkowych.
 */
export type Grosze = number;

export function isGrosze(value: number): value is Grosze {
  return Number.isSafeInteger(value);
}

export function sumGrosze(amounts: readonly Grosze[]): Grosze {
  let total = 0;
  for (const amount of amounts) {
    if (!isGrosze(amount)) {
      throw new RangeError(`Kwota musi być całkowitą liczbą groszy, otrzymano: ${amount}`);
    }
    total += amount;
  }
  if (!isGrosze(total)) {
    throw new RangeError("Suma przekracza bezpieczny zakres liczb całkowitych");
  }
  return total;
}
