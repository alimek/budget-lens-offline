/**
 * Number and currency formatting data for the app languages, transcribed from Unicode CLDR (checked against
 * CLDR 46 in #38 and CLDR 48 in Node.js 24). CLDR data: Copyright © Unicode, Inc., Unicode License v3,
 * https://www.unicode.org/license.txt.
 *
 * - `pl`: CLDR `pl` (grouping U+00A0, minimum grouping digits 2, symbol after the number).
 * - `en`: `en-GB` currency conventions (`£`, `€`, `US$`, `JP¥` before the number) and the `en` compact suffixes
 *   (`K`, `M`, `B`, `T`), as chosen in #38.
 *
 * Only the symbols listed in #38 are included; every other currency is shown by its ISO 4217 code.
 */
import type { CurrencyCode } from "./currency";
import type { Language } from "./settings";

const NBSP = "\u00a0";

export interface LocaleData {
  readonly decimalSeparator: string;
  readonly groupSeparator: string;
  /** CLDR `minimumGroupingDigits`: 2 means `1234` but `12 345`. */
  readonly minimumGroupingDigits: number;
  /** Where the currency symbol or code goes. The minus sign always comes first (`-1234,50 zł`, `-£1,234.50`). */
  readonly currencyPosition: "before" | "after";
  /** Currency symbols; a currency without one is shown by its ISO code. */
  readonly currencySymbols: Partial<Record<CurrencyCode, string>>;
  /** Between the number and a symbol. */
  readonly symbolSpacing: string;
  /** Between the number and an ISO code. */
  readonly codeSpacing: string;
  /** Compact suffixes by power of ten, ascending (CLDR short decimal formats). */
  readonly compactSuffixes: readonly { readonly power: number; readonly suffix: string }[];
  /** Between the number and the compact suffix. */
  readonly compactSpacing: string;
}

export const LOCALE_DATA: Readonly<Record<Language, LocaleData>> = {
  pl: {
    decimalSeparator: ",",
    groupSeparator: NBSP,
    minimumGroupingDigits: 2,
    currencyPosition: "after",
    currencySymbols: { EUR: "€", PLN: "zł" },
    symbolSpacing: NBSP,
    codeSpacing: NBSP,
    compactSuffixes: [
      { power: 3, suffix: "tys." },
      { power: 6, suffix: "mln" },
      { power: 9, suffix: "mld" },
      { power: 12, suffix: "bln" },
    ],
    compactSpacing: NBSP,
  },
  en: {
    decimalSeparator: ".",
    groupSeparator: ",",
    minimumGroupingDigits: 1,
    currencyPosition: "before",
    currencySymbols: { EUR: "€", GBP: "£", JPY: "JP¥", USD: "US$" },
    symbolSpacing: "",
    codeSpacing: NBSP,
    compactSuffixes: [
      { power: 3, suffix: "K" },
      { power: 6, suffix: "M" },
      { power: 9, suffix: "B" },
      { power: 12, suffix: "T" },
    ],
    compactSpacing: "",
  },
};
