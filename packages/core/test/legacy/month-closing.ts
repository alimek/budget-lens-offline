/**
 * LEGACY REFERENCE – the state transitions performed by apps/web/src/lib/actions/months.ts in the old Budget Lens
 * repository. Supabase/Next calls are removed; each function returns exactly the row payload the
 * legacy code wrote to the `months` table (without `id`/`user_id`). Do not "fix" this file.
 */

export interface LegacyMonthRow {
  id: string;
  /** 1-12 */
  month: number;
  year: number;
  status: "active" | "closed";
  opening_balance: number;
  closing_balance: number;
  total_income: number;
  total_expenses: number;
  net_change: number;
}

/** Insert payload of `getMonths()` when the user has no months yet. */
export function legacyInitialMonth(now: Date = new Date()) {
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    status: "active" as const,
    opening_balance: 0,
    closing_balance: 0,
    total_income: 0,
    total_expenses: 0,
    net_change: 0,
    started_at: now.toISOString(),
  };
}

/** Update payload of `updateMonthBalance(balance)` for the active month. */
export function legacyUpdateMonthBalance(month: LegacyMonthRow, balance: number) {
  return {
    closing_balance: balance,
    net_change: balance - month.opening_balance,
    updated_at: new Date().toISOString(),
  };
}

/** The two writes of `closeMonth()`: update of the active month and insert of the next one. */
export function legacyCloseMonth(month: LegacyMonthRow) {
  const closeUpdate = {
    status: "closed" as const,
    closed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const nextMonth = month.month === 12 ? 1 : month.month + 1;
  const nextYear = month.month === 12 ? month.year + 1 : month.year;

  const nextMonthInsert = {
    month: nextMonth,
    year: nextYear,
    status: "active" as const,
    opening_balance: month.closing_balance,
    closing_balance: month.closing_balance,
    total_income: 0,
    total_expenses: 0,
    net_change: 0,
    started_at: new Date().toISOString(),
  };

  return { closeUpdate, nextMonthInsert };
}
