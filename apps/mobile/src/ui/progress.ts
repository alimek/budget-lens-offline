import type { MinorUnits } from "@budget-lens/core";

export interface BudgetProgressValue {
  /** Share of the budget used, clamped to 0..1 for the native progress indicator. */
  readonly fraction: number;
  /** Spent more than the budget: the indicator switches to the `expense` colour. */
  readonly over: boolean;
}

/** Progress of `spent` against `budget` (both minor units of the same currency). */
export function budgetProgress(spent: MinorUnits, budget: MinorUnits): BudgetProgressValue {
  const over = spent > budget;
  if (budget <= 0) return { fraction: spent > 0 ? 1 : 0, over };
  return { fraction: Math.min(Math.max(spent / budget, 0), 1), over };
}
