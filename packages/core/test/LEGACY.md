# Characterization tests (golden master)

These tests pin down how the **old** Budget Lens implementation behaves today – including its
defects – so that every deliberate behaviour change in `packages/core` shows up as a diff in the
tests. See issue #3.

- `legacy/` – reference copies of the old functions (from `alimek/budget-lens`), with React,
  Next.js and Supabase removed. They are test-only code: do not fix or reuse them.
- `fixtures/` – JSON fixtures (expenses, incomes, NBP responses).
- `*.characterization.test.ts` – the tests, written as Arrange / Act / Assert. They cover business
  rules only (recurrence, forecast, month closing, rate refresh, money parsing). The clock and the
  process time zone are frozen with `useFrozenClock` / `freezeClockAt` (`helpers.ts`), because the
  legacy code reads `new Date()`.
- `__snapshots__/` – golden master of the 13-month forecast for the fixture budget.

Polish strings in `legacy/` and in assertions (month names, the ` (nadpisanie)` override suffix,
warning messages, `zł`) are legacy user-facing data, kept verbatim on purpose.

When a port changes one of the behaviours below, update the test, move the assertion to the new
implementation's tests and remove the `LEGACY:` marker.

## `LEGACY:` behaviours

| Area | Legacy behaviour | Changed by |
| --- | --- | --- |
| Money | Amounts are PLN floats: `0.1 + 0.2 = 0.30000000000000004` in monthly totals | #2 |
| Money | `formatCurrency` never shows grosze (rounds to whole złoty) | #2 |
| Money | `formatCurrencyCompact` does not compact negative amounts (`-5000` → `"-5000"`) | #2 |
| Money | Balance input drops the decimal comma: `"1 234,56 zł"` → `123456` | #2 |
| Money | Savings conversion uses `parseFloat`: `"1,5"` → `1` | #2, #8 |
| Money | Warning messages use `toLocaleString()` without a locale | #2, #6 |
| Forecast | The start month comes from `new Date()` in the device time zone | #6 |
| Forecast | Balance exactly 0 produces no warning | #6 |
| Forecast | Warning thresholds 5000 / -10000 are hard-coded instead of coming from settings | #6, #76 |
| Month closing | `closeMonth` does not store totals of the closed month | #84 |
| Month closing | The first month starts with `opening_balance: 0`; its month comes from local time, `started_at` from UTC | #84 |
| NBP | Network errors propagate unchanged (no offline fallback) | #8 |
| NBP | Currency list is hard-coded (USD, EUR, GBP, CHF, JPY) | #8 |
| NBP | `refreshAllExchangeRates` fails as a whole when one currency fails | #8 |
