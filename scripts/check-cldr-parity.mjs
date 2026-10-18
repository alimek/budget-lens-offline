// Dev-only CLDR parity check (not run in CI): compares the Intl-free formatters of packages/core
// (formatMoney, formatMoneyCompact) with Node.js ICU (Intl.NumberFormat) for every supported currency and both app
// languages, so drift between the CLDR data in money-locale.ts and current CLDR shows up after a Node.js upgrade.
// Run: pnpm check:cldr-parity [randomCasesPerCurrency] (Node.js >= 24, no build step; see docs/domain/money.md).
// Decision record: docs/decisions/0011-money-formatting-without-intl.md
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

// packages/core imports siblings without an extension ("./money"); resolve them to the .ts sources, which Node.js
// runs with its built-in type stripping.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.\.?\//.test(specifier) && !/\.[cm]?[jt]s$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const { formatMoney, formatMoneyCompact, toMinorUnits } = await import(
  "../packages/core/src/index.ts"
);
const { currencyExponent } = await import("../packages/core/src/currency.ts");
const { LOCALE_DATA } = await import("../packages/core/src/money-locale.ts");

/** Every supported currency: the table behind isCurrencyCode (PLN + NBP table A without XDR). */
const CURRENCIES = readFileSync(
  new URL("../packages/core/src/currency.ts", import.meta.url),
  "utf8",
)
  .match(/^ {2}([A-Z]{3}): \d,$/gm)
  .map((line) => line.trim().slice(0, 3));

/** Intl locale per app language: currency format and compact format (see docs/domain/money.md). */
const LOCALES = {
  pl: { currency: "pl-PL", compact: "pl-PL" },
  en: { currency: "en-GB", compact: "en" },
};
/** Currencies whose compact output is checked (compact has no symbol; only the exponent matters). */
const COMPACT_CURRENCIES = ["PLN", "EUR", "JPY"];

const randomCases = Number(process.argv[2] ?? 4000);
if (!Number.isSafeInteger(randomCases) || randomCases < 0) {
  throw new RangeError(`Invalid number of random cases: ${process.argv[2]}`);
}

/** Deterministic xorshift PRNG, so a failure can be reproduced with the same arguments. */
let seed = 0x2f6e2b1n;
function nextRandom() {
  seed ^= (seed << 13n) & 0xffffffffffffffffn;
  seed ^= seed >> 7n;
  seed ^= (seed << 17n) & 0xffffffffffffffffn;
  return seed;
}

const MAX = BigInt(Number.MAX_SAFE_INTEGER);
function amounts() {
  const boundaries = [
    0n,
    1n,
    49n,
    50n,
    99n,
    100n,
    999n,
    1000n,
    123456n,
    999949n,
    999950n,
    999999n,
    1000000n,
    99999949n,
    99999950n,
    999999999n,
    123456789n,
    99995000n,
    999950000n,
    999999500n,
    123456789012n,
    999999999999n,
    100000000000000n,
    MAX,
  ];
  const list = [...boundaries, ...boundaries.map((value) => -value)];
  for (let index = 0; index < randomCases; index += 1) {
    const digits = 1n + (nextRandom() % 16n);
    const value = nextRandom() % (10n ** digits < MAX ? 10n ** digits : MAX);
    list.push(index % 2 === 0 ? value : -value);
  }
  return list;
}

/** Exact decimal string of `minor / 10^exponent`, which Intl.NumberFormat formats without float rounding. */
function toDecimal(minor, exponent) {
  const sign = minor < 0n ? "-" : "";
  const digits = String(minor < 0n ? -minor : minor).padStart(exponent + 1, "0");
  return exponent === 0
    ? `${sign}${digits}`
    : `${sign}${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
}

/** The first 50 differences are printed; `differences` counts all of them. */
const mismatches = [];
let cases = 0;
let differences = 0;
function compare(label, expected, actual) {
  cases += 1;
  if (expected === actual) {
    return;
  }
  differences += 1;
  if (mismatches.length < 50) {
    mismatches.push({ label, icu: JSON.stringify(expected), core: JSON.stringify(actual) });
  }
}

const values = amounts();
for (const lang of Object.keys(LOCALES)) {
  for (const currency of CURRENCIES) {
    const exponent = currencyExponent(currency);
    const hasSymbol = LOCALE_DATA[lang].currencySymbols[currency] !== undefined;
    for (const fractionDigits of ["currency", 0]) {
      const digits = fractionDigits === 0 ? 0 : exponent;
      const icu = new Intl.NumberFormat(LOCALES[lang].currency, {
        style: "currency",
        currency,
        currencyDisplay: hasSymbol ? "symbol" : "code",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        roundingMode: "halfExpand",
        // core never shows -0 (deliberate change from legacy, see LEGACY.md); "negative" does the same in ICU.
        signDisplay: "negative",
      });
      for (const value of values) {
        compare(
          `formatMoney ${lang} ${currency} fractionDigits=${fractionDigits} ${value}`,
          icu.format(toDecimal(value, exponent)),
          formatMoney(toMinorUnits(Number(value)), { lang, currency, fractionDigits }),
        );
      }
    }
  }
  for (const currency of COMPACT_CURRENCIES) {
    const exponent = currencyExponent(currency);
    const icu = new Intl.NumberFormat(LOCALES[lang].compact, {
      notation: "compact",
      compactDisplay: "short",
      roundingMode: "halfExpand",
      signDisplay: "negative",
    });
    for (const value of values) {
      compare(
        `formatMoneyCompact ${lang} ${currency} ${value}`,
        icu.format(toDecimal(value, exponent)),
        formatMoneyCompact(toMinorUnits(Number(value)), { lang, currency }),
      );
    }
  }
}

console.log(
  `Node.js ${process.versions.node}, ICU ${process.versions.icu}, CLDR ${process.versions.cldr}: ${cases} cases`,
);
if (differences > 0) {
  console.table(mismatches);
  console.error(`${differences} differences from ICU.`);
  console.error(
    "CLDR parity check failed: update money-locale.ts or document the difference in money.md.",
  );
  process.exitCode = 1;
} else {
  console.log("No differences from ICU.");
}
