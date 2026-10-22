import { describe, expect, it } from "vitest";
import {
  addCurrencyAmounts,
  addMinorUnits,
  type CurrencyAmount,
  type CurrencyCode,
  convertMinorExact,
  convertViaPln,
  isMinorUnits,
  type MinorUnits,
  MoneyOverflowError,
  multiplyByRate,
  negateMinorUnits,
  subtractMinorUnits,
  sumCurrencyAmounts,
  sumMinorUnits,
  toMinorUnits,
} from "./index";

const MAX = Number.MAX_SAFE_INTEGER;
const MIN = Number.MIN_SAFE_INTEGER;

/** Bypasses validation to simulate invalid values coming from untyped sources. */
const unchecked = (values: number[]): MinorUnits[] => values as MinorUnits[];

const amounts = (values: number[]): MinorUnits[] => values.map(toMinorUnits);

const errorThrownBy = (action: () => unknown): unknown => {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
};

describe("isMinorUnits", () => {
  it("accepts integers", () => {
    expect(isMinorUnits(0)).toBe(true);
    expect(isMinorUnits(1999)).toBe(true);
    expect(isMinorUnits(-250)).toBe(true);
  });

  it("accepts the safe integer boundaries", () => {
    expect(isMinorUnits(MAX)).toBe(true);
    expect(isMinorUnits(MIN)).toBe(true);
  });

  it("rejects values just outside the safe integer range", () => {
    expect(isMinorUnits(MAX + 1)).toBe(false);
    expect(isMinorUnits(MIN - 1)).toBe(false);
  });

  it("accepts negative zero", () => {
    expect(isMinorUnits(-0)).toBe(true);
  });

  it("rejects fractions", () => {
    expect(isMinorUnits(19.99)).toBe(false);
    expect(isMinorUnits(0.5)).toBe(false);
    expect(isMinorUnits(-0.1)).toBe(false);
  });

  it("rejects non-finite values", () => {
    expect(isMinorUnits(Number.NaN)).toBe(false);
    expect(isMinorUnits(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isMinorUnits(Number.NEGATIVE_INFINITY)).toBe(false);
  });
});

describe("toMinorUnits", () => {
  it("returns the same value for safe integers", () => {
    expect(toMinorUnits(1999)).toBe(1999);
    expect(toMinorUnits(MAX)).toBe(MAX);
    expect(toMinorUnits(MIN)).toBe(MIN);
  });

  it("normalizes negative zero to zero", () => {
    expect(Object.is(toMinorUnits(-0), 0)).toBe(true);
  });

  it("throws for values that are not safe integers", () => {
    expect(() => toMinorUnits(0.5)).toThrow(RangeError);
    expect(() => toMinorUnits(MAX + 1)).toThrow(RangeError);
    expect(() => toMinorUnits(MIN - 1)).toThrow(RangeError);
    expect(() => toMinorUnits(Number.NaN)).toThrow(RangeError);
    expect(() => toMinorUnits(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("sumMinorUnits", () => {
  it("returns 0 for an empty list", () => {
    expect(sumMinorUnits([])).toBe(0);
  });

  it("sums amounts without rounding errors", () => {
    // 0.10 + 0.20 = 0.30 (with floats: 0.1 + 0.2 !== 0.3)
    expect(sumMinorUnits(amounts([10, 20]))).toBe(30);
    expect(sumMinorUnits(amounts([1999, -500, 1]))).toBe(1500);
  });

  it("sums up to the safe integer boundaries", () => {
    expect(sumMinorUnits(amounts([MAX - 1, 1]))).toBe(MAX);
    expect(sumMinorUnits(amounts([MIN + 1, -1]))).toBe(MIN);
  });

  it("throws for an amount that is not an integer number of minor units", () => {
    expect(() => sumMinorUnits(unchecked([100, 0.5]))).toThrow(RangeError);
  });

  it("throws for NaN and Infinity in the list", () => {
    expect(() => sumMinorUnits(unchecked([100, Number.NaN]))).toThrow(RangeError);
    expect(() => sumMinorUnits(unchecked([100, Number.POSITIVE_INFINITY]))).toThrow(RangeError);
    expect(() => sumMinorUnits(unchecked([100, Number.NEGATIVE_INFINITY]))).toThrow(RangeError);
  });

  it("throws on overflow", () => {
    expect(() => sumMinorUnits(amounts([MAX, 1]))).toThrow(RangeError);
  });

  it("throws on intermediate overflow even if the final sum would be in range", () => {
    // Float addition makes MAX + 2 - 2 silently wrong, so the range is checked after every step.
    expect(() => sumMinorUnits(amounts([MAX, 2, -2]))).toThrow(RangeError);
  });

  it("throws on underflow", () => {
    expect(() => sumMinorUnits(amounts([MIN, -1]))).toThrow(RangeError);
    expect(() => sumMinorUnits(amounts([MIN, -2, 2]))).toThrow(RangeError);
  });

  it("rejects plain numbers at compile time", () => {
    // @ts-expect-error plain numbers must go through toMinorUnits first
    expect(sumMinorUnits([10, 20])).toBe(30);
  });

  it("does not mutate the input", () => {
    const input = Object.freeze(amounts([10, 20, 30]));
    expect(sumMinorUnits(input)).toBe(60);
    expect(input).toEqual([10, 20, 30]);
  });
});

describe("addMinorUnits / subtractMinorUnits", () => {
  it("adds and subtracts exactly and rejects a result outside the safe integer range", () => {
    // Arrange
    const ten = toMinorUnits(10);
    const twenty = toMinorUnits(20);
    const max = toMinorUnits(MAX);

    // Act
    const sum = addMinorUnits(ten, twenty);
    const difference = subtractMinorUnits(ten, twenty);

    // Assert
    expect(sum).toBe(30);
    expect(difference).toBe(-10);
    expect(() => addMinorUnits(max, ten)).toThrow(RangeError);
    expect(() => subtractMinorUnits(negateMinorUnits(max), ten)).toThrow(RangeError);
  });
});

describe("addCurrencyAmounts / sumCurrencyAmounts", () => {
  const pln = (value: number): CurrencyAmount => ({
    currency: "PLN",
    amount: toMinorUnits(value),
  });
  const yen = (value: number): CurrencyAmount => ({
    currency: "JPY",
    amount: toMinorUnits(value),
  });

  it("adds amounts of one currency and keeps that currency", () => {
    // Arrange
    const rent = pln(300_000);
    const fee = pln(12_500);

    // Act
    const total = addCurrencyAmounts(rent, fee);

    // Assert
    expect(total).toEqual({ ok: true, value: { currency: "PLN", amount: 312_500 } });
  });

  it("refuses to add amounts of different currencies and reports both codes", () => {
    // Arrange
    const rent = pln(300_000);
    const salary = yen(300_000);

    // Act
    const pair = addCurrencyAmounts(rent, salary);
    const sum = sumCurrencyAmounts("PLN", [rent, salary, rent]);

    // Assert: never a total that mixes the scales of two currencies
    expect(pair).toEqual({ ok: false, error: "currency-mismatch", currencies: ["PLN", "JPY"] });
    expect(sum).toEqual({ ok: false, error: "currency-mismatch", currencies: ["PLN", "JPY"] });
  });

  it("sums amounts of one currency, starting at zero in that currency", () => {
    // Arrange
    const amounts = [yen(1000), yen(250)];

    // Act
    const total = sumCurrencyAmounts("JPY", amounts);
    const none = sumCurrencyAmounts("JPY", []);

    // Assert: JPY minor units are whole yen, unchanged by summing
    expect(total).toEqual({ ok: true, value: { currency: "JPY", amount: 1250 } });
    expect(none).toEqual({ ok: true, value: { currency: "JPY", amount: 0 } });
  });

  it("rejects an amount without its currency at compile time", () => {
    // @ts-expect-error every amount must say which currency it is in
    expect(addCurrencyAmounts({ amount: toMinorUnits(10) }, pln(20)).ok).toBe(false);
  });
});

describe("multiplyByRate", () => {
  it("converts with a per-unit rate exactly and rounds half away from zero", () => {
    // Arrange
    const cases: [amount: number, rate: number][] = [
      [1_000_000, 0.024574], // 10 000 JPY in minor units at the NBP mid of 202/A/NBP/2026
      [100, 0.285], // 28.5 exactly; a float product would give 28.499999999999996
      [1, 0.5],
      [-1, 0.5],
      [3, 0.5],
      [1, 0.49],
    ];

    // Act
    const results = cases.map(([amount, rate]) => multiplyByRate(toMinorUnits(amount), rate));

    // Assert
    expect(results).toEqual([24574, 29, 1, -1, 2, 0]);
  });

  it("rejects a negative or non-finite rate", () => {
    // Arrange
    const amount = toMinorUnits(100);
    const invalidRates = [-1, Number.NaN, Number.POSITIVE_INFINITY];

    // Act
    const errors = invalidRates.map((rate) => errorThrownBy(() => multiplyByRate(amount, rate)));

    // Assert
    expect(errors).toEqual(invalidRates.map(() => expect.any(RangeError)));
  });
});

it("preserves decimal-string precision near a rounding tie", () => {
  // Arrange
  const amount = toMinorUnits(1);

  // Act
  const result = convertMinorExact(amount, "0.49999999999999999", "1", "EUR", "PLN");

  // Assert
  expect(result).toBe(0);
});

it("rejects a zero denominator in exact conversion", () => {
  // Arrange
  const amount = toMinorUnits(1);

  // Act
  const action = () => convertMinorExact(amount, "1", "0", "EUR", "PLN");

  // Assert
  expect(action).toThrow("invalid-rate");
});

const plnRates: Partial<Record<CurrencyCode, string>> = {
  EUR: "4.3661",
  USD: "3.8827",
  JPY: "0.024574",
};

describe("convertViaPln", () => {
  it.each([
    [100000, "PLN", "EUR", 22904],
    [10000, "EUR", "PLN", 43661],
    [10000, "USD", "EUR", 8893],
    [-10000, "USD", "EUR", -8893],
    [10000, "JPY", "PLN", 24574],
    [10000, "PLN", "JPY", 4069],
    [1, "JPY", "EUR", 1],
  ] as const)("converts %s %s to %s with one rounding", (amount, from, to, expected) => {
    // Arrange
    const source = toMinorUnits(amount);

    // Act
    const result = convertViaPln(source, from, to, (currency) => plnRates[currency]);

    // Assert
    expect(result).toBe(expected);
  });

  it.each([
    [1, 1],
    [-1, -1],
    [3, 2],
    [-3, -2],
  ] as const)("rounds ties away from zero: %s", (amount, expected) => {
    // Arrange
    const source = toMinorUnits(amount);

    // Act
    const result = convertViaPln(source, "EUR", "PLN", () => "0.5");

    // Assert
    expect(result).toBe(expected);
  });

  it("keeps identity exact without consulting rates", () => {
    // Arrange
    const source = toMinorUnits(Number.MAX_SAFE_INTEGER);

    // Act
    const result = convertViaPln(source, "JPY", "JPY", () => {
      throw new Error("Unexpected rate lookup");
    });

    // Assert
    expect(result).toBe(source);
  });

  it("rejects conversion overflow", () => {
    // Arrange
    const source = toMinorUnits(Number.MAX_SAFE_INTEGER);

    // Act
    const action = () => convertViaPln(source, "EUR", "PLN", () => "2");

    // Assert
    expect(action).toThrow(MoneyOverflowError);
  });
});
