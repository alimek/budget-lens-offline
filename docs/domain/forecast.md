# Forecast

Status: **not implemented yet** in `packages/core` – tracked in #6.

## Legacy behaviour (`lib/hooks/use-forecast.ts`, React hook `useForecast`)

- Projects **13 months** starting from the current month (read from `new Date()`).
- Rolling balance: the current month starts from the current balance, each next month from the previous month's
  closing balance; `totalFunds = balance + totalSavings`.
- In the current month only **unpaid expenses and not-yet-received incomes** are counted (payment statuses).
- Warnings `critical` / `caution` / `info` with Polish messages and hardcoded thresholds: low balance when
  `0 < balance < 5000`, large outflow when `netChange < -10000`. A balance of exactly 0 produces no warning, even
  though `user_settings.low_balance_threshold` (default 5000) exists in the database.
- Messages use `toLocaleString()` without a locale and a hardcoded "PLN"; month names come from Polish names via
  `substring(0, 3)`.

## Target (#6)

- A pure function, e.g. `forecast({ items, overrides, paymentStatuses, currentBalance, totalSavings, fromMonth, months, settings })`.
- Horizon is a parameter (legacy default 13); the start month is an argument – no system clock.
- Warnings are data (code + parameters), translated in the UI; thresholds come only from `Settings`
  (see [month-closing.md](month-closing.md)).
- All amounts in `MinorUnits`, recurrence from #4, overrides from #5.
