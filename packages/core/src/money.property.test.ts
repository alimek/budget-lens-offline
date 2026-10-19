import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { currencyExponent } from "./currency";
import {
  type CurrencyCode,
  convertMinor,
  convertMinorExact,
  formatMoney,
  isCurrencyCode,
  type MinorUnits,
  multiplyByRate,
  negateMinorUnits,
  parseMoney,
  sumMinorUnits,
  toMinorUnits,
} from "./index";

// Amounts in realistic size bands, each band equally likely, so that typical amounts (with a thousands separator)
// are generated as often as tiny and huge ones. A plain `fc.integer({ min: -1e12, max: 1e12 })` puts about 89% of
// its samples above 10^9 and almost never produces an amount between 1 000 and 999 999 (review on #159).
const SMALL = fc.integer({ min: 0, max: 999 });
const TYPICAL = fc.integer({ min: 1_000, max: 999_999 });
const LARGE = fc.integer({ min: 1_000_000, max: 999_999_999 });
// Up to 10^12 minor units: every partial sum of up to 100 of them stays a safe integer, and a number this size still
// shows every minor unit when it is converted to a double for display.
const HUGE = fc.integer({ min: 1_000_000_000, max: 1e12 });

/** A signed amount whose magnitude is drawn from one of the given bands (never `-0`). */
const signedAmount = (...bands: fc.Arbitrary<number>[]): fc.Arbitrary<MinorUnits> =>
  fc
    .tuple(fc.oneof(...bands), fc.boolean())
    .map(([magnitude, negative]) =>
      toMinorUnits(negative && magnitude !== 0 ? -magnitude : magnitude),
    );

const amount = signedAmount(SMALL, TYPICAL, LARGE, HUGE);
const amountList = fc.array(amount, { maxLength: 100 });
const language = fc.constantFrom("pl" as const, "en" as const);

const exactSum = (amounts: readonly MinorUnits[]): bigint =>
  amounts.reduce((total, value) => total + BigInt(value), 0n);

describe("sumMinorUnits (properties)", () => {
  it("equals the exact integer sum, without rounding errors", () => {
    // Arrange
    const property = fc.property(amountList, (amounts) => {
      // Act
      const total = sumMinorUnits(amounts);

      // Assert
      expect(BigInt(total)).toBe(exactSum(amounts));
    });

    fc.assert(property);
  });
});

describe("toMinorUnits (properties)", () => {
  it("rejects every amount that is not a whole number of minor units", () => {
    // Arrange
    const fraction = fc
      .double({ noNaN: true, noDefaultInfinity: true })
      .filter((value) => !Number.isInteger(value));
    const property = fc.property(fraction, (value) => {
      // Act + Assert
      expect(() => toMinorUnits(value)).toThrow(RangeError);
    });

    fc.assert(property);
  });
});

// Every currency of the ISO 4217 table: the declared `Record` type fails the typecheck until a currency added to
// `src/currency.ts` is listed here too.
const ALL_CURRENCIES: Record<CurrencyCode, true> = {
  AUD: true,
  BRL: true,
  CAD: true,
  CHF: true,
  CLP: true,
  CNY: true,
  CZK: true,
  DKK: true,
  EUR: true,
  GBP: true,
  HKD: true,
  HUF: true,
  IDR: true,
  ILS: true,
  INR: true,
  ISK: true,
  JPY: true,
  KRW: true,
  MXN: true,
  MYR: true,
  NOK: true,
  NZD: true,
  PHP: true,
  PLN: true,
  RON: true,
  SEK: true,
  SGD: true,
  THB: true,
  TRY: true,
  UAH: true,
  USD: true,
  ZAR: true,
};
const currencies = Object.keys(ALL_CURRENCIES).filter(isCurrencyCode);
const currency = fc.constantFrom(...currencies);

// Currencies without minor digits (CLP, ISK, JPY, KRW) are left out of the full round trip. In English
// `formatMoney` groups thousands with a comma (`JP¥1,000`), and `parseMoney` reads a single `,` or `.` as the decimal
// separator (#2), so it rejects an amount with exactly one thousands group (1 000 – 999 999) with
// `too-many-fraction-digits` (counterexample `[1000]`, seed 1178002064). Whether `parseMoney` should accept it
// partially reverses #2 and needs an owner decision, tracked in #164; until then that band is skipped for them.
const decimalCurrencies = currencies.filter((code) => currencyExponent(code) > 0);
const zeroDecimalCurrencies = currencies.filter((code) => currencyExponent(code) === 0);

/**
 * The number the user sees and can type back, without the currency symbol: its spelling, spacing and position are
 * platform-specific (#131), so only the digits, grouping and decimal separator are compared.
 */
const typedBack = (formatted: string): string => {
  const firstDigit = formatted.search(/\d/);
  const digits = formatted.slice(firstDigit, formatted.replace(/\D+$/, "").length);
  return /[-\u2212]/.test(formatted.slice(0, firstDigit)) ? `-${digits}` : digits;
};

/** Asserts that typing back what `formatMoney` printed gives the same amount, in each of the given currencies. */
const expectRoundTrip = (
  value: MinorUnits,
  lang: "pl" | "en",
  roundTripCurrencies: readonly CurrencyCode[],
): void => {
  for (const code of roundTripCurrencies) {
    // Act
    const formatted = formatMoney(value, { lang, currency: code });

    // Assert: typing the formatted amount back gives exactly the amount we started with.
    expect({
      currency: code,
      lang,
      parsed: parseMoney(typedBack(formatted), { currency: code }),
    }).toEqual({
      currency: code,
      lang,
      parsed: { ok: true, value },
    });
  }
};

describe("formatMoney and parseMoney (properties)", () => {
  it("returns the same amount when a formatted amount is typed back, in currencies with minor digits", () => {
    // Arrange
    const property = fc.property(language, amount, (lang, value) => {
      // Act + Assert
      expectRoundTrip(value, lang, decimalCurrencies);
    });

    fc.assert(property);
  });

  it("returns the same amount when typed back in currencies without minor digits, except English with one thousands group (#164)", () => {
    // Arrange: Polish groups with spaces and parses in every band; English skips 1 000 – 999 999 (see above).
    const languageAndAmount = fc.oneof(
      fc.tuple(fc.constant("pl" as const), amount),
      fc.tuple(fc.constant("en" as const), signedAmount(SMALL, LARGE, HUGE)),
    );
    const property = fc.property(languageAndAmount, ([lang, value]) => {
      // Act + Assert
      expectRoundTrip(value, lang, zeroDecimalCurrencies);
    });

    fc.assert(property);
  });
});

// NBP prints at most 6 decimals, so rates are generated as whole millionths of a rate unit, up to 5000.999999.
// With at most 10 significant digits, the generated decimal is the one `multiplyByRate` reads from `String(rate)`.
const RATE_MICRO_UNITS = 1_000_000;
const rateMicroUnits = fc.integer({ min: 0, max: 5_000_999_999 });

describe("multiplyByRate (properties)", () => {
  it("converts to a whole number of minor units at most half a minor unit from the exact product", () => {
    // Arrange
    const property = fc.property(amount, rateMicroUnits, (value, microUnits) => {
      // Act
      const converted = multiplyByRate(value, microUnits / RATE_MICRO_UNITS);

      // Assert: an exact number of minor units, with a deviation – in millionths of a minor unit – of at most
      // 500 000, which is half of one.
      expect(Number.isSafeInteger(converted)).toBe(true);
      const deviation =
        BigInt(converted) * BigInt(RATE_MICRO_UNITS) - BigInt(value) * BigInt(microUnits);
      const absoluteDeviation = deviation < 0n ? -deviation : deviation;
      expect(absoluteDeviation).toBeLessThanOrEqual(500_000n);
    });

    fc.assert(property);
  });

  it("rounds an exact half minor unit away from zero", () => {
    // Arrange: an odd amount multiplied by a half-integer rate always lands exactly on a half minor unit.
    const oddAmount = amount.filter((value) => value % 2 !== 0);
    const halfStepRate = fc.constantFrom(0.5, 1.5, 2.5, 7.5);
    const property = fc.property(oddAmount, halfStepRate, (value, rate) => {
      // Act
      const converted = multiplyByRate(value, rate);

      // Assert: the whole minor unit further from zero than the exact product, held below as twice that product.
      const twiceTheExactProduct = BigInt(value) * BigInt(Math.round(rate * 2));
      const absoluteExactProduct =
        twiceTheExactProduct < 0n ? -twiceTheExactProduct : twiceTheExactProduct;
      expect(Math.abs(converted) * 2 - Number(absoluteExactProduct)).toBe(1);
    });

    fc.assert(property);
  });
});

/** Exact decimal string of a whole number of millionths, e.g. `1500000n` → `"1.500000"`. */
const microUnitsToDecimal = (microUnits: bigint): string =>
  `${microUnits / 1_000_000n}.${(microUnits % 1_000_000n).toString().padStart(6, "0")}`;

// Amounts up to 10^9 minor units: converted at any generated rate (up to about 5001) and into a currency with two
// more minor digits, the result still stays far inside the safe integer range.
const convertibleAmount = signedAmount(SMALL, TYPICAL, LARGE);

describe("convertMinor (properties)", () => {
  it("only rescales the amount at rate 1 into a currency with as many or more minor digits, and converts it back losslessly", () => {
    // Arrange: the pair ordered so that the first currency never has more minor digits than the second.
    const widening = fc
      .tuple(currency, currency)
      .map(([first, second]) =>
        currencyExponent(first) <= currencyExponent(second)
          ? ([first, second] as const)
          : ([second, first] as const),
      );
    const property = fc.property(convertibleAmount, widening, (value, [fewer, more]) => {
      const scale = 10 ** (currencyExponent(more) - currencyExponent(fewer));

      // Act
      const converted = convertMinor(value, 1, fewer, more);
      const convertedBack = convertMinor(converted, 1, more, fewer);

      // Assert: the same amount in the finer minor unit (unchanged for the same currency), and back exactly.
      expect(converted).toBe(value * scale);
      expect(convertedBack).toBe(value);
    });

    fc.assert(property);
  });

  it("converts to a whole number of minor units at most half a target minor unit from the exact value", () => {
    // Arrange
    const property = fc.property(
      convertibleAmount,
      rateMicroUnits,
      currency,
      currency,
      (value, microUnits, source, target) => {
        const shift = currencyExponent(target) - currencyExponent(source);

        // Act
        const converted = convertMinor(value, microUnits / RATE_MICRO_UNITS, source, target);

        // Assert: both sides scaled to millionths of a target minor unit (and of a source minor unit when the
        // target has fewer digits); the deviation is at most half of one target minor unit.
        expect(Number.isSafeInteger(converted)).toBe(true);
        const targetUnit = BigInt(RATE_MICRO_UNITS) * 10n ** BigInt(Math.max(-shift, 0));
        const deviation =
          BigInt(converted) * targetUnit -
          BigInt(value) * BigInt(microUnits) * 10n ** BigInt(Math.max(shift, 0));
        const absoluteDeviation = deviation < 0n ? -deviation : deviation;
        expect(absoluteDeviation * 2n).toBeLessThanOrEqual(targetUnit);
      },
    );

    fc.assert(property);
  });

  it("keeps the sign: a negated amount converts to the negated result, never to the opposite sign", () => {
    // Arrange
    const property = fc.property(
      convertibleAmount,
      rateMicroUnits,
      currency,
      currency,
      (value, microUnits, source, target) => {
        const rate = microUnits / RATE_MICRO_UNITS;

        // Act
        const converted = convertMinor(value, rate, source, target);
        const convertedNegation = convertMinor(negateMinorUnits(value), rate, source, target);

        // Assert: compared as BigInt, so that 0 and -0 count as the same amount.
        expect(BigInt(convertedNegation)).toBe(-BigInt(converted));
        expect(Math.sign(converted) * Math.sign(value)).toBeGreaterThanOrEqual(0);
      },
    );

    fc.assert(property);
  });

  it("never converts a larger amount to a smaller one at the same rate", () => {
    // Arrange
    const property = fc.property(
      convertibleAmount,
      convertibleAmount,
      rateMicroUnits,
      currency,
      currency,
      (first, second, microUnits, source, target) => {
        const [smaller, larger] = first <= second ? [first, second] : [second, first];
        const rate = microUnits / RATE_MICRO_UNITS;

        // Act
        const convertedSmaller = convertMinor(smaller, rate, source, target);
        const convertedLarger = convertMinor(larger, rate, source, target);

        // Assert
        expect(convertedSmaller).toBeLessThanOrEqual(convertedLarger);
      },
    );

    fc.assert(property);
  });

  it("gives the same result as convertMinorExact for any pair of quotes with the same ratio", () => {
    // Arrange: the rate as sourceRate / targetRate = (rate * k) / k, both written as exact decimal strings.
    const quoteScale = fc.integer({ min: 1, max: 1_000 });
    const property = fc.property(
      convertibleAmount,
      rateMicroUnits,
      quoteScale,
      currency,
      currency,
      (value, microUnits, scale, source, target) => {
        // Act
        const converted = convertMinor(value, microUnits / RATE_MICRO_UNITS, source, target);
        const convertedExact = convertMinorExact(
          value,
          microUnitsToDecimal(BigInt(microUnits) * BigInt(scale)),
          String(scale),
          source,
          target,
        );

        // Assert
        expect(convertedExact).toBe(converted);
      },
    );

    fc.assert(property);
  });
});
