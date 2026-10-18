# Money

## Implemented (#2)

Amounts are integers in **minor units** of their currency. The scale is the currency's ISO 4217 exponent
(`packages/core/src/currency.ts`): 2 for PLN (1 zł = 100 groszy), EUR, USD and most others, 0 for JPY, ISK, KRW
and CLP. The table holds PLN and the currencies of NBP table A except XDR (#39); these are the only supported
currencies ([owner decision](https://github.com/alimek/budget-lens-offline/pull/117#issuecomment-6254596752)).
`isCurrencyCode(value)` narrows an unchecked string (e.g. from storage) to `CurrencyCode`; `Settings` rejects other
codes with `unsupported-currency` ([settings.md](settings.md)). There are no floats in the public API.

### Type and operations (`packages/core/src/money.ts`)

- `MinorUnits` – branded `number` (`number & { readonly __brand: "MinorUnits" }`), always a **safe integer**.
  `number` was chosen over `bigint`: the safe range (±90 trillion PLN) is far beyond any budget, and plain numbers
  work with SQLite and JSON without conversions.
- `toMinorUnits(value)` – the only way to create a `MinorUnits` from a plain number; throws `RangeError` for
  non-integers, `NaN`, `±Infinity` and values outside the safe integer range; normalizes `-0` to `0`.
- `isMinorUnits(value)` – type guard (`Number.isSafeInteger`).
- `sumMinorUnits(amounts)` – sums without mutating the input; validates every amount and checks the safe range
  after **each** addition, so an intermediate overflow/underflow throws `RangeError` instead of returning a wrong
  result.
- `addMinorUnits(a, b)`, `subtractMinorUnits(a, b)`, `negateMinorUnits(amount)` – exact; a result outside the safe
  range throws `RangeError`.
- `multiplyByRate(amount, rate)` – multiplies by a rate (e.g. an NBP `mid`, per 1 unit of the currency) and rounds
  to whole minor units **half away from zero** (0.5 → 1, −0.5 → −1). The rate is taken as the decimal it prints
  as (`String(rate)`) and the product is computed with `bigint`, so `100 × 0.285` is exactly 28.5 → 29 (a float
  product gives 28.499999999999996). A negative or non-finite rate, or a result outside the safe range, throws
  `RangeError`.
  - **The result keeps the scale of `amount`.** It is a correct conversion only when the source and target
    currencies have the same exponent (e.g. EUR → PLN, both 2). When the exponents differ, the result must also be
    scaled by `10^(targetExponent − sourceExponent)`: `multiplyByRate(10000 /* ¥10 000 */, 0.024574)` gives `246`,
    i.e. 2,46 zł, while the correct value is 24 574 groszy = 245,74 zł (100× more). This scaling is not done by
    `multiplyByRate`; it is handled by `convertMinor` (#39), planned with #8/#92. Until then, do not use
    `multiplyByRate` alone to convert between currencies with different exponents (JPY, ISK, KRW, CLP).

### Parsing (`packages/core/src/money-parse.ts`)

`parseMoney(input, { currency? })` turns user input in major units (e.g. złoty) into minor units without floats and
returns
`{ ok: true, value }` or `{ ok: false, error }`. Error codes (`ParseMoneyError`, translated by the UI):
`"empty"`, `"invalid-format"`, `"too-many-fraction-digits"`, `"out-of-range"`.

- Optional leading minus (`-` or `−`), digits, at most as many fraction digits as the currency's exponent
  (**2** without `currency`; `"12,5"` is `too-many-fraction-digits` for JPY) after a decimal **comma or dot**.
- Thousands grouping: spaces (U+0020, the no-break spaces U+00A0 and U+202F) or the separator that is not the
  decimal one; groups after the first must have 3 digits. Examples: `"1 234,56"`, `"1234.5"`, `"-12"`,
  `"1.234,56"`, `"1,234.56"`, `"1.234.567"`.
- A single `,` or `.` is always the decimal separator, so `"1,234"` is rejected (`too-many-fraction-digits`) instead
  of being guessed.
- Currency symbols and letters (`"1 234,56 zł"`), a leading plus (`"+12"`), a missing integer part (`",5"`), a
  trailing separator (`"12,"`), tabs or line breaks inside the number (`"1\t234"`) and malformed grouping
  (`"1 23"`) are rejected (`invalid-format`). Whitespace around the number is trimmed.

### Formatting (`packages/core/src/money-format.ts`)

Formatting does **not** use `Intl.NumberFormat`. Hermes on iOS ignores `notation: "compact"` and `signDisplay`,
and its iOS (`NSNumberFormatter`) and Android (ICU4J) output can differ (#38). `packages/core` formats with its own
integer-only code and a small table of CLDR data for the two app languages (`money-locale.ts`), so the output is
the same in Vitest, on iOS and on Android. Digits are built from the integer amount with `bigint`, never from
`amount / 100`, so every safe amount is exact: `Number.MAX_SAFE_INTEGER` PLN minor units give
`90 071 992 547 409,91 zł`.

The language is always a parameter: `lang: "pl" | "en"` (`Language` from `Settings`, i.e. the app language with `"system"` resolved by the app; #38). `currency` is a `CurrencyCode`.

| | `pl` (CLDR `pl`) | `en` (CLDR `en-GB` currency conventions, `en` compact suffixes) |
| --- | --- | --- |
| Decimal / grouping | `,` / U+00A0 no-break space | `.` / `,` |
| Minimum grouping digits | 2: `1234,50 zł`, `12 345,67 zł` | 1: `£1,234.50` |
| Currency | after the number, U+00A0 before it: `1234,50 zł` | before the number, no space for a symbol (`£1,234.50`), U+00A0 after a code (`PLN 1,234.50`) |
| Symbols | PLN `zł`, EUR `€` | GBP `£`, EUR `€`, USD `US$`, JPY `JP¥` |
| Minus | ASCII `-` first: `-1234,50 zł` | ASCII `-` first: `-£1,234.50`, `-PLN 1,234.50` |
| Compact | U+00A0 before the suffix: `5 tys.`, `1,5 mln`, `1 mld`, `1 bln` | no space: `5K`, `1.5M`, `1B`, `1T` |

Spaces: every space in the output is a **no-break space U+00A0**, the character CLDR uses in these patterns
(grouping in `pl`, number–symbol in `pl`, code–number in `en`, number–suffix in `pl` compact). The narrow no-break
space U+202F is not used. Only the symbols listed in #38 are in the table; every other currency is shown by its
ISO 4217 code (`5,00 USD`, `CHF 5.00`), which differs from CLDR for a few `en` symbols (e.g. CLDR has `CA$`).

- `formatMoney(amount, { lang, currency, fractionDigits? })` – currency string with the currency's fraction digits
  (`fractionDigits: "currency"`, the default; 0 for JPY: `JP¥123,450`). `fractionDigits: 0` shows whole units,
  rounded half away from zero, which reproduces the legacy `formatCurrency` (`pl`, `PLN`); a characterization test
  checks that they match.
- **No `-0`:** an amount that rounds to 0 has no minus sign, so −1 to −49 groszy with `fractionDigits: 0` give
  `0 zł`. This is a deliberate change from legacy `formatCurrency` (`-0 zł`, see `LEGACY.md`).
- `formatMoneyCompact(amount, { lang, currency })` – CLDR short compact notation without a currency symbol,
  negative amounts included: `5 tys.`, `-5 tys.`, `1,5 mln` (`pl`); `5K`, `-5K`, `1.5M` (`en`). `currency` gives
  only the exponent. Rounding follows the CLDR/ECMA-402 compact defaults: 2 significant digits below 10
  (`1,5 mln`), whole numbers from 10 (`12 tys.`), half away from zero; a value that rounds up to 1000 moves to the
  next suffix (999 999,99 zł → `1 mln`). Amounts below 1000 units are not compacted (`12`, `0,05`).

**ICU parity check (dev-only, not in CI).** `pnpm check:cldr-parity` (`scripts/check-cldr-parity.mjs`, Node.js
24 or later, no build step and no extra dependencies) compares `formatMoney` and `formatMoneyCompact` with Node.js ICU
(`Intl.NumberFormat`): boundary and seeded random amounts up to ±`Number.MAX_SAFE_INTEGER`, every supported currency
× `pl-PL`/`en-GB` × `fractionDigits` `"currency"`/`0` (symbol display where the table has a symbol, code display
otherwise; digits fixed to the exponent; `halfExpand`; `signDisplay: "negative"` for the intended no-`-0` change),
and compact output for `pl-PL`/`en` (PLN, EUR, JPY). It prints the Node.js, ICU and CLDR versions and exits with
code 1 on any difference. An optional argument sets the number of random amounts (default 4000). Run it after a
Node.js upgrade or a change to `money-locale.ts`. With Node.js 24 (ICU 78.3, CLDR 48; #38 checked CLDR 46) it
reports no differences.

Known differences from `Intl` defaults: `HUF` and `IDR` are shown with their ISO 4217 exponent (2 digits, #39),
where CLDR/ICU show 0 by default; the parity check fixes the digits to the exponent, so it does not report them.
CLDR data: Copyright © Unicode, Inc., [Unicode License v3](https://www.unicode.org/license.txt).

Tests compare exact strings, with `\u00a0` written out.

Rules: amounts never use floats; never pass plain numbers where `MinorUnits` is expected (the compiler rejects it).

## Legacy behaviour

- Amounts are JavaScript floats in TypeScript and `DECIMAL(12,2)` in the database; dialogs parse input with
  `Number.parseFloat`.
- `formatCurrency` (pl-PL, PLN, 0 fraction digits) is duplicated in `lib/mock-data.ts` and `lib/hooks/use-budget.ts`.
  It shows `-0 zł` for amounts from −0,01 to −0,49 zł.
- `formatCurrencyCompact` does not compact negative values (`-5000` → `"-5000"`, not `"-5k"`) and hardcodes the
  `k` / `M` suffixes.
- `update-balance-sheet.tsx` parses with `parseFloat(balance.replace(/[^0-9.-]/g, ""))`, so the Polish decimal comma
  is dropped: `"1234,56"` → `123456`.

These behaviours are pinned in `packages/core/test/format.characterization.test.ts`; see
[`LEGACY.md`](../../packages/core/test/LEGACY.md).

## Not covered yet

- From #38/#39, not part of #2: `display: "code"`, privacy masking (#79), compact amounts with a currency
  (`1,2 mln zł`), month and date labels, `allowNegative` and the other parser changes proposed in #38, and the
  `convertMinor` cross-rate conversion (#8/#92).
- Warning messages that use `toLocaleString()` without a locale (#6).
