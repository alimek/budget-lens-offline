# Money

## Implemented (`packages/core/src/money.ts`)

- `MinorUnits` – branded `number` (`number & { readonly __brand: "MinorUnits" }`): an amount in the currency's
  minor units (1 PLN = 100 grosze). Always a **safe integer**.
- `toMinorUnits(value)` – the only way to create a `MinorUnits` from a plain number; throws `RangeError` for
  non-integers, `NaN`, `±Infinity` and values outside the safe integer range; normalizes `-0` to `0`.
- `isMinorUnits(value)` – type guard (`Number.isSafeInteger`).
- `sumMinorUnits(amounts)` – sums without mutating the input; validates every amount and checks the safe range
  after **each** addition, so an intermediate overflow/underflow throws `RangeError` instead of returning a wrong
  result.

Rules: amounts never use floats; never pass plain numbers where `MinorUnits` is expected (the compiler rejects it).

## Legacy behaviour

- Amounts are JavaScript floats in TypeScript and `DECIMAL(12,2)` in the database; dialogs parse input with
  `Number.parseFloat`.
- `formatCurrency` (pl-PL, PLN, 0 fraction digits) is duplicated in `lib/mock-data.ts` and `lib/hooks/use-budget.ts`.
- `formatCurrencyCompact` does not compact negative values (`-5000` → `"-5000"`, not `"-5k"`).
- `update-balance-sheet.tsx` parses with `parseFloat(balance.replace(/[^0-9.-]/g, ""))`, so the Polish decimal comma
  is dropped: `"1234,56"` → `123456`.

## Target (#2, open)

- Operations `add`, `sub`, `sum`, `negate`, `multiplyByRate` with an explicit, documented rounding mode.
- Parsing user input (`"1 234,56"`, `"1234.5"`, `"-12"`) into minor units; invalid input is rejected.
- `formatMoney(amount, { locale, currency, fractionDigits })` keeping the legacy default (pl-PL, PLN, 0 digits) as an
  option and supporting 2 digits; `formatMoneyCompact` that handles negative values. One implementation only.
