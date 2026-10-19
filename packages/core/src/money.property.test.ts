import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  type CurrencyCode,
  formatMoney,
  isCurrencyCode,
  type MinorUnits,
  multiplyByRate,
  parseMoney,
  sumMinorUnits,
  toMinorUnits,
} from "./index";

// Amounts up to 10^12 minor units: every partial sum of up to 100 of them stays a safe integer, and a number this
// size still shows every minor unit when it is converted to a double for display.
const amount = fc.integer({ min: -1e12, max: 1e12 }).map(toMinorUnits);
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

/**
 * The number the user sees and can type back, without the currency symbol: its spelling, spacing and position are
 * platform-specific (#131), so only the digits, grouping and decimal separator are compared.
 */
const typedBack = (formatted: string): string => {
  const firstDigit = formatted.search(/\d/);
  const digits = formatted.slice(firstDigit, formatted.replace(/\D+$/, "").length);
  return /[-\u2212]/.test(formatted.slice(0, firstDigit)) ? `-${digits}` : digits;
};

describe("formatMoney and parseMoney (properties)", () => {
  it("returns the same amount when a formatted amount is typed back, in every currency and language", () => {
    // Arrange
    const property = fc.property(language, amount, (lang, value) => {
      for (const currency of currencies) {
        // Act
        const formatted = formatMoney(value, { lang, currency });

        // Assert: typing the formatted amount back gives exactly the amount we started with.
        expect({ currency, lang, parsed: parseMoney(typedBack(formatted), { currency }) }).toEqual({
          currency,
          lang,
          parsed: { ok: true, value },
        });
      }
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
