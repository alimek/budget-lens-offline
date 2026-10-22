# Money

## Implemented (#2)

Amounts are integers in **minor units** of their currency. The scale is the currency's ISO 4217 exponent
(`packages/core/src/currency.ts`): 2 for PLN (1 zł = 100 groszy), EUR, USD and most others, 0 for JPY, ISK, KRW
and CLP. The table holds PLN and the currencies of NBP table A except XDR (#39); these are the only supported
currencies ([owner decision](https://github.com/alimek/budget-lens-offline/pull/117#issuecomment-6254596752)).
`isCurrencyCode(value)` narrows an unchecked string (e.g. from storage) to `CurrencyCode`; `Settings` types its
currency fields as `CurrencyCode` (#126) and rejects other codes with `unsupported-currency`
([settings.md](settings.md)). There are no floats in the public API.

### Type and operations (`packages/core/src/money.ts`)

- `MinorUnits` – branded `number` (`number & { readonly __brand: "MinorUnits" }`), always a **safe integer**.
  `number` was chosen over `bigint`: the safe range (±90 trillion PLN) is far beyond any budget, and plain numbers
  work with SQLite and JSON without conversions.
- `toMinorUnits(value)` – the only way to create a `MinorUnits` from a plain number; throws `RangeError` for
  non-integers, `NaN`, `±Infinity` and values outside the safe integer range; normalizes `-0` to `0`.
- `isMinorUnits(value)` – type guard (`Number.isSafeInteger`).
- `sumMinorUnits(amounts)` – sums without mutating the input; validates every amount and checks the safe range
  after **each** addition, so an intermediate overflow/underflow throws `MoneyOverflowError` instead of returning a wrong
  result.
- `addMinorUnits(a, b)`, `subtractMinorUnits(a, b)`, `negateMinorUnits(amount)` – exact; a result outside the safe
  range throws `MoneyOverflowError`.
- `multiplyByRate(amount, rate)` – multiplies by a rate (e.g. an NBP `mid`, per 1 unit of the currency) and rounds
  to whole minor units **half away from zero** (0.5 → 1, −0.5 → −1). The rate is taken as the decimal it prints
  as (`String(rate)`) and the product is computed with `bigint`, so `100 × 0.285` is exactly 28.5 → 29 (a float
  product gives 28.499999999999996). A negative or non-finite rate, or a result outside the safe range, throws
  `RangeError`.
  - **The result keeps the scale of `amount`.** It is a correct conversion only when the source and target
    currencies have the same exponent (e.g. EUR → PLN, both 2). When the exponents differ, the result must also be
    scaled by `10^(targetExponent − sourceExponent)`: `multiplyByRate(10000 /* ¥10 000 */, 0.024574)` gives `246`,
    i.e. 2,46 zł, while the correct value is 24 574 groszy = 245,74 zł (100× more). This scaling is not done by
    `multiplyByRate`; it is handled by `convertMinor` (#84). Do not use
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
- A single `,` or `.` is the decimal separator, so `"1,234"` is rejected (`too-many-fraction-digits`) instead of
  being guessed.
- Exception for currencies without minor digits (exponent 0: CLP, ISK, JPY, KRW; owner decision on
  [#164](https://github.com/alimek/budget-lens-offline/issues/164)): a single `,` or `.` followed by exactly 3 digits is
  a thousands separator, so `"1,000"` and `"1.000"` are 1000 JPY and the English output of `formatMoney`
  (`JP¥123,450`) can be typed back. Any other fraction (`"12,5"`, `"1,0000"`) is still `too-many-fraction-digits`,
  and the grouping rules below still apply (`"1234,567"` and `"1 000,000"` are `invalid-format`).
- Currency symbols and letters (`"1 234,56 zł"`), a leading plus (`"+12"`), a missing integer part (`",5"`), a
  trailing separator (`"12,"`), tabs or line breaks inside the number (`"1\t234"`) and malformed grouping
  (`"1 23"`) are rejected (`invalid-format`). Whitespace around the number is trimmed.

### Formatting (`packages/core/src/money-format.ts`)

`formatMoney(amount, { lang, currency, fractionDigits? })` uses native `Intl.NumberFormat` with
`style: "currency"` ([ADR 0012](../decisions/0012-native-intl-money-formatting.md), #131).
`lang: "pl" | "en"` is the app language from `Settings`, with `"system"` resolved by the app; it selects
`pl-PL` or `en-GB`. `currency` is a supported `CurrencyCode`.

- Always show full amounts, including charts. There is no compact formatter or hand-maintained locale data.
- Default fraction digits come from the ISO 4217 exponent table, explicitly setting both minimum and maximum
  digits (including 2 for HUF/IDR and 0 for JPY).
- `fractionDigits: 0` rounds to whole major units **half away from zero** using `bigint` before calling Intl.
  Charts may use this option. Native half-rounding differences do not affect this step.
- Validate the branded safe-integer minor amount before conversion. Currency exponents determine the scale.
  Only the final display value becomes a floating-point major-unit number for Hermes Intl; storage, parsing and
  arithmetic remain integer-only. Near the safe-integer limit, this display conversion can lose a final minor
  digit; native formatting does not guarantee exact output for every safe minor-unit amount.
- Normalize zero before calling Intl, including negative zero and negative amounts rounded to zero.
- Native symbols, spacing and grouping may differ between iOS, Android and Node.js ICU. These differences are
  accepted by the [owner decision](https://github.com/alimek/budget-lens-offline/issues/131).
  Tests compare with the current runtime's standard currency formatter, never fixed platform-dependent strings.
- Do not use `formatToParts`, `signDisplay` or `Intl.PluralRules`: Hermes support is incomplete
  ([#38 probe](https://github.com/alimek/budget-lens-offline/issues/38#issuecomment-6255104039)). UI plurals still
  need the planned `@formatjs/intl-pluralrules` polyfill (#37/#77); this change does not add it.

Parsing remains independent of Intl and unchanged. Never pass plain numbers where `MinorUnits` is expected.

`MoneyOverflowError` is a `RangeError` subclass for arithmetic/conversion results outside the safe-integer range.
Invalid inputs still throw ordinary `RangeError`, allowing forecast to report overflow without masking unrelated failures.

### Amounts that carry a currency (#138)

A `MinorUnits` number says nothing about its currency, and the scale of a minor unit differs per currency (1 zł is
100 groszy, ¥1 is 1 yen), so adding a JPY amount to a PLN amount would produce a meaningless number. Amounts that
travel through the app together with their currency are therefore `CurrencyAmount` (`{ currency, amount }`) and are
added only with:

- `addCurrencyAmounts(a, b)` – the sum of two `CurrencyAmount`s, or `{ ok: false, error: "currency-mismatch",
  currencies: [a.currency, b.currency] }`. Different currencies are **never** added; the caller converts one of
  them first (`convertMinor`, `convertViaPln`) or keeps the totals apart. The code is returned for the UI to
  translate, nothing is thrown for it.
- `sumCurrencyAmounts(expected, amounts)` – the same rule folded over a list, starting from `expected` with 0, and
  stopping at the first foreign amount. Closing totals use it, tagging each converted `baseAmount` with the month's
  `baseCurrency`, so a snapshot row of another currency is reported (`invalid-currency`) instead of inflating a
  base-currency total.

This is the guard for "core never adds amounts in different currencies": the pair `CurrencyCode` + `MinorUnits` is
what you add, and the runtime check turns a mistake into a code. `MinorUnits` itself stays one brand (no
per-currency type): it works with SQLite and JSON unchanged, and forecast and closing keep converting every
occurrence to the base currency **before** summing, so their results are unchanged. Amounts that never carry a
currency (a base-currency balance, a threshold) stay plain `MinorUnits` and use `addMinorUnits` / `sumMinorUnits`.

An item's amounts are minor units of the **item's** currency (`ScheduledItem.currency`, `VersionedItem.currency`,
`ResolvedOccurrence.currency`), so item input and display always pass that currency: parse with
`parseMoney(text, { currency: item.currency })` and format with
`formatMoney(amount, { lang, currency: item.currency })`. The exponent of that currency decides the fraction digits
(2 for PLN, 0 for JPY); an item amount is never rescaled between parsing, resolving and formatting.

### Currency conversion (#84)

`convertMinor(amount, rate, source, target)` converts between supported currencies using their ISO exponents.
The rate is target major units per source major unit. It shares exact BigInt decimal arithmetic with
`multiplyByRate`, scales before rounding and rounds once, half away from zero, to target minor units.
It throws `RangeError` for invalid rates/currencies or overflow, like the other money primitives. Closing catches
conversion failures and returns domain error codes; fetching/choosing rates remains outside money arithmetic.

`convertMinorExact(amount, sourceRate, targetRate, source, target)` accepts decimal-string legs quoted in the same
currency and uses their exact ratio before exponent scaling. `convertMinor` delegates to this form with denominator
`"1"`. It shares the single rounding/overflow implementation with `multiplyByRate` in `money.ts`.
The source rate is non-negative, the target rate positive; decimal exponent notation is also accepted for numeric
callers. No conversion goes through a floating-point cross-rate. `convertViaPln` (#6) selects PLN-quoted legs and
calls this function; it performs no arithmetic or rounding itself.

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

- From #38/#39, not part of #2: `display: "code"`, privacy masking (#79), month and date labels, `allowNegative`
  and the other parser changes proposed in #38, and cross-rate selection from NBP/manual quotes (#8/#92).
  `convertMinor` arithmetic is implemented in #84.
- Warning translation and display belong to the UI; #6 returns codes and base-currency parameters.
