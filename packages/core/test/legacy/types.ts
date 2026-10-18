/**
 * Minimal copies of the legacy Budget Lens domain types (apps/web/src/lib/hooks/use-budget.ts),
 * reduced to the fields the legacy calculations read. Amounts are floats in PLN, as in legacy.
 */
export interface LegacyExpense {
  id: string;
  name: string;
  amount: number;
  type: "recurring" | "one-time";
  frequency?: "monthly" | "quarterly" | "yearly";
  /** Month for yearly expenses, 1-12. */
  startMonth?: number;
  /** "YYYY-MM" for one-time expenses. */
  targetMonth?: string;
}

export interface LegacyIncome {
  id: string;
  name: string;
  amount: number;
  type: "recurring" | "one-time";
  frequency?: "monthly";
  /** "YYYY-MM" for one-time incomes. */
  targetMonth?: string;
}
