# Month closing

Status: **not implemented yet** in `packages/core` – tracked in #84 (split from #7).

## Legacy behaviour (`lib/actions/months.ts`, `close-month-dialog.tsx`)

- Closing the active month creates the next month with `opening_balance` = closing balance of the closed month
  (December → January of the next year).
- `closeMonth` does **not** store `total_income` / `total_expenses` / `net_change` of the closed month.
- Closing and creating the next month are two separate queries without a transaction.
- The first month is created automatically with `opening_balance: 0`.
- The close dialog sums all items as floats and ignores overrides.

## Target (#84)

- `closeMonth(activeMonth, { items, overrides, paymentStatuses, closingBalance })` → `{ closed, next }`: the closed
  month carries `totalIncome`, `totalExpenses`, `netChange`; `next.openingBalance = closingBalance`.
- Validation: exactly one active month, no closing a future month, a list of unpaid/unreceived items to confirm.
- `updateBalance(activeMonth, balance)`.
- Thresholds and currencies come only from `Settings` ([settings.md](settings.md)).
