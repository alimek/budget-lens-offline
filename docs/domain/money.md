# Money

## Implemented (#2)

Amounts are integers in **minor units** of a currency with 2 fraction digits (1 PLN = 100 grosze). There are no
floats in the public API.

### Type and operations (`packages/core/src/money.ts`)

- `MinorUnits` – branded `number` (`number & { readonly __brand: "MinorUnits" }`), always a **safe integer**.
  `number` was chosen over `bigint`: the safe range (±90 trillion PLN) is far beyond any budget, and plain numbers
  work with SQLite, JSON and `Intl` without conversions.
- `toMinorUnits(value)` – the only way to create a `MinorUnits` from a plain number; throws `RangeError` for
  non-integers, `NaN`, `±Infinity` and values outside the safe integer range; normalizes `-0` to `0`.
- `isMinorUnits(value)` – type guard (`Number.isSafeInteger`).
- `sumMinorUnits(amounts)` – sums without mutating the input; validates every amount and checks the safe range
  after **each** addition, so an intermediate overflow/underflow throws `RangeError` instead of returning a wrong
  result.
- `addMinorUnits(a, b)`, `subtractMinorUnits(a, b)`, `negateMinorUnits(amount)` – exact; a result outside the safe
  range throws `RangeError`.
- `multiplyByRate(amount, rate)` – multiplies by a rate (e.g. an NBP `mid`, per 1 unit of the currency) and rounds
  to whole minor units **half away from zero** (0.5 → 1, −0.5 → −1). The rate is taken as the decimal it prints as
  (`String(rate)`) and the product is computed with `bigint`, so `100 × 0.285` is exactly 28.5 → 29 (a float
  product gives 28.499999999999996). A negative or non-finite rate, or a result outside the safe range, throws
  `RangeError`.

### Parsing (`packages/core/src/money-parse.ts`)

`parseMoney(input)` turns user input in major units (e.g. złoty) into minor units without floats and returns
`{ ok: true, value }` or `{ ok: false, error }`. Error codes (`ParseMoneyError`, translated by the UI):
`"empty"`, `"invalid-format"`, `"too-many-fraction-digits"`, `"out-of-range"`.

- Optional leading minus (`-` or `−`), digits, at most **2 fraction digits** after a decimal **comma or dot**.
- Thousands grouping: spaces (including no-break spaces) or the separator that is not the decimal one; groups after
  the first must have 3 digits. Examples: `"1 234,56"`, `"1234.5"`, `"-12"`, `"1.234,56"`, `"1,234.56"`,
  `"1.234.567"`.
- A single `,` or `.` is always the decimal separator, so `"1,234"` is rejected (`too-many-fraction-digits`) instead
  of being guessed.
- Currency symbols and letters (`"1 234,56 zł"`), a trailing separator (`"12,"`) and malformed grouping (`"1 23"`)
  are rejected (`invalid-format`).

### Formatting (`packages/core/src/money-format.ts`)

The locale is always a parameter; nothing is hardcoded, and all text comes from `Intl.NumberFormat`.

- `formatMoney(amount, { locale, currency, fractionDigits? })` – localized currency string with 2 fraction digits
  by default, e.g. `1234,56 zł` (`pl-PL`) or `PLN 1,234.56` (`en`). `fractionDigits: 0` reproduces the legacy
  `formatCurrency` (`pl-PL`, `PLN`, rounded half away from zero); a characterization test checks that they match.
- `formatMoneyCompact(amount, { locale })` – the locale's compact notation without a currency symbol, negative
  amounts included: `5 tys.`, `-5 tys.`, `1,5 mln` (`pl-PL`); `5K`, `-5K`, `1.5M` (`en`).

Exact output (spaces are no-break spaces, compact suffixes) comes from the runtime's `Intl` data. Tests run on
Node.js; `Intl` support on Hermes (SDK 58) is researched in #38.

Rules: amounts never use floats; never pass plain numbers where `MinorUnits` is expected (the compiler rejects it).

## Legacy behaviour

- Amounts are JavaScript floats in TypeScript and `DECIMAL(12,2)` in the database; dialogs parse input with
  `Number.parseFloat`.
- `formatCurrency` (pl-PL, PLN, 0 fraction digits) is duplicated in `lib/mock-data.ts` and `lib/hooks/use-budget.ts`.
- `formatCurrencyCompact` does not compact negative values (`-5000` → `"-5000"`, not `"-5k"`) and hardcodes the
  `k` / `M` suffixes.
- `update-balance-sheet.tsx` parses with `parseFloat(balance.replace(/[^0-9.-]/g, ""))`, so the Polish decimal comma
  is dropped: `"1234,56"` → `123456`.

These behaviours are pinned in `packages/core/test/format.characterization.test.ts`; see
[`LEGACY.md`](../../packages/core/test/LEGACY.md).

## Not covered yet

- Currencies with other than 2 fraction digits (e.g. JPY has 0): `MinorUnits` assumes 1/100. The currency model is
  researched in #39.
- Warning messages that use `toLocaleString()` without a locale (#6).
