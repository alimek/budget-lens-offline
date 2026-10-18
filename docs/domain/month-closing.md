# Month closing and settings

Status: **not implemented yet** in `packages/core` – tracked in #7.

## Legacy behaviour (`lib/actions/months.ts`, `close-month-dialog.tsx`)

- Closing the active month creates the next month with `opening_balance` = closing balance of the closed month
  (December → January of the next year).
- `closeMonth` does **not** store `total_income` / `total_expenses` / `net_change` of the closed month.
- Closing and creating the next month are two separate queries without a transaction.
- The first month is created automatically with `opening_balance: 0`.
- The close dialog sums all items as floats and ignores overrides.
- Warning thresholds are hardcoded in `use-forecast.ts`; `user_settings.low_balance_threshold` is unused and not
  shown in the settings panel.

## Target (#7)

- `closeMonth(activeMonth, { items, overrides, paymentStatuses, closingBalance })` → `{ closed, next }`: the closed
  month carries `totalIncome`, `totalExpenses`, `netChange`; `next.openingBalance = closingBalance`.
- Validation: exactly one active month, no closing a future month, a list of unpaid/unreceived items to confirm.
- `updateBalance(activeMonth, balance)`.
- **Settings-driven thresholds:** a `Settings` model in core with `lowBalanceThreshold`, `largeExpenseThreshold`
  (`MinorUnits`), `defaultCurrency`, `trackedCurrencies`. Defaults match legacy: 5000 PLN / 10000 PLN, PLN,
  USD/EUR/GBP. The forecast (#6) takes thresholds only from `Settings`.
