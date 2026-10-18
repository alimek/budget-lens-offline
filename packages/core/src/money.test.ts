import { describe, expect, it } from "vitest";
import { isGrosze, sumGrosze } from "./index";

describe("isGrosze", () => {
  it("akceptuje liczby całkowite", () => {
    expect(isGrosze(0)).toBe(true);
    expect(isGrosze(1999)).toBe(true);
    expect(isGrosze(-250)).toBe(true);
  });

  it("odrzuca ułamki i wartości nieskończone", () => {
    expect(isGrosze(19.99)).toBe(false);
    expect(isGrosze(Number.NaN)).toBe(false);
    expect(isGrosze(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("sumGrosze", () => {
  it("zwraca 0 dla pustej listy", () => {
    expect(sumGrosze([])).toBe(0);
  });

  it("sumuje kwoty w groszach bez błędów zaokrągleń", () => {
    // 0,10 zł + 0,20 zł = 0,30 zł (w float: 0.1 + 0.2 !== 0.3)
    expect(sumGrosze([10, 20])).toBe(30);
    expect(sumGrosze([1999, -500, 1])).toBe(1500);
  });

  it("rzuca błąd dla kwoty niebędącej całkowitą liczbą groszy", () => {
    expect(() => sumGrosze([100, 0.5])).toThrow(RangeError);
  });

  it("rzuca błąd przy przekroczeniu bezpiecznego zakresu", () => {
    expect(() => sumGrosze([Number.MAX_SAFE_INTEGER, 1])).toThrow(RangeError);
  });
});
