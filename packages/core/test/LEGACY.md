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

When a port changes one of the behaviours below, test the new behaviour in the new implementation's
tests and mark the row and its `LEGACY:` marker as fixed, naming the issue, the replacing function and
its test (`LEGACY: … – fixed in #2: …`). The characterization test itself stays: it pins the reference
copy in `legacy/`, which does not change. When a row is shared by several issues, note which part is
done and which issues remain.

## `LEGACY:` behaviours

| Area | Legacy behaviour | Changed by | Status in `packages/core` |
| --- | --- | --- | --- |
| Money | Amounts are PLN floats: `0.1 + 0.2 = 0.30000000000000004` in monthly totals | #2 | **Fixed in #2:** integer minor units, `sumMinorUnits` (`src/money-parse.test.ts`: 0,1 zł + 0.2 zł = 30 grosze) |
| Money | `formatCurrency` never shows grosze (rounds to whole złoty) | #2 | **Fixed in #2:** `formatMoney` shows 2 fraction digits by default; `fractionDigits: 0` keeps the legacy output (`src/money-format.test.ts`) |
| Money | `formatCurrency` shows `-0 zł` for amounts from −0,01 to −0,49 zł | #2 | **Fixed in #2:** `formatMoney` shows no minus sign on an amount that rounds to 0 (`0 zł`, `src/money-format.test.ts`) |
| Money | `formatCurrencyCompact` does not compact negative amounts (`-5000` → `"-5000"`) | #2 | **Superseded by #131:** core always formats full currency amounts; compact formatting was removed |
| Money | Balance input drops the decimal comma: `"1 234,56 zł"` → `123456` | #2 | **Fixed in #2:** `parseMoney` takes a decimal comma or dot, `"1 234,56"` → 123456 grosze (`src/money-parse.test.ts`) |
| Money | Savings conversion uses `parseFloat`: `"1,5"` → `1` | #2, #8 | **#2 part done:** `parseMoney` parses `"1,5"` → 150 grosze and `multiplyByRate` converts exactly; the savings conversion is ported in #8 |
| Money | Warning messages use `toLocaleString()` without a locale | #2, #6 | **#2 part done:** `formatMoney` takes the app language (`lang`) as a parameter; the warnings are ported in #6 |
| Recurrence | Quarterly items are always active in Jan/Apr/Jul/Oct | #4 | **Fixed in #4:** any anchor month, `isActiveInMonth` (`src/recurrence.test.ts`) |
| Recurrence | Yearly items without `startMonth` default to January | #4 | **Fixed in #4:** every recurring schedule has an explicit `anchor` (`src/recurrence.test.ts`) |
| Recurrence | Recurring items have no start/end date (active also before creation) | #4 | **Fixed in #4:** schedules start at `anchor` and may have an `endMonth` (`src/recurrence.test.ts`) |
| Recurrence | Incomes support only monthly recurrence | #4 | **Fixed in #4:** incomes and expenses share `Schedule`, with any interval (`src/recurrence.test.ts`) |
| Overrides | Overrides are one-time items named `"<name> (nadpisanie)"`, matched by name | #5 | **Fixed in #5:** id-based `OccurrenceOverride`s matched by `(itemType, itemId)`; no legacy import (`src/occurrence-overrides.test.ts`) |
| Overrides | Monthly totals (`calculateMonthly*`) count both the item and its override | #5 | **Fixed in #5:** `resolveOccurrences` uses the overridden amount instead of the item's (`test/occurrence-overrides.characterization.test.ts`) |
| Overrides | Items sharing a name are all replaced; renaming an item breaks its overrides | #5 | **Fixed in #5:** overrides match by item id, so same-name items and renames are unaffected (`src/occurrence-overrides.test.ts`) |
| Forecast | The start month comes from `new Date()` in the device time zone | #6 | Open |
| Forecast | Balance exactly 0 produces no warning | #6 | Open |
| Forecast | Warning thresholds 5000 / -10000 are hard-coded instead of coming from settings | #6, #76 | Open |
| Month closing | `closeMonth` does not store totals of the closed month | #84 | **Fixed in #84:** `closeMonth` stores converted base-currency totals after overrides, frozen original amounts/currencies/rates, and the actual balance change (`src/month-closing.test.ts`); carry-forward and rollover remain compared with legacy (`test/month-closing.characterization.test.ts`) |
| Month closing | The first month starts with `opening_balance: 0`; its month comes from local time, `started_at` from UTC | #84 | **Fixed in #84:** `createInitialMonth` takes an explicit `YearMonth` and opening balance, without reading time (`src/month-closing.test.ts`); timestamps belong to persistence (#85) |
| NBP | Network errors propagate unchanged (no offline fallback) | #8 | **Fixed in #8:** read-only `getRate` retains stale cached quotes after failed refresh (`src/exchange-rates.test.ts`) |
| NBP | Currency list is hard-coded (USD, EUR, GBP, CHF, JPY) | #8 | **Fixed in #8:** `requiredRateCurrencies` combines Settings, item and savings currencies (`src/exchange-rates.test.ts`) |
| NBP | `refreshAllExchangeRates` fails as a whole when one currency fails | #8 | **Fixed in #8:** `fetchNbpRates` / `refreshNbpRates` return per-currency results and preserve successes (`src/exchange-rates.test.ts`) |
