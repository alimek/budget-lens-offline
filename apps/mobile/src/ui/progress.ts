import type { MinorUnits } from "@budget-lens/core";

export interface BudgetProgressValue {
  /** Share of the budget used, clamped to 0..1 for the native progress indicator. */
  readonly fraction: number;
  /** Spent more than the budget: shown with the `expense` colour and an "over budget" status text. */
  readonly over: boolean;
  /** Whole percent of the budget used, not clamped (120 when 20% over); 0 for a negative spend. */
  readonly percent: number;
}

/** Progress of `spent` against `budget` (both minor units of the same currency). */
export function budgetProgress(spent: MinorUnits, budget: MinorUnits): BudgetProgressValue {
  const over = spent > budget;
  if (budget <= 0) {
    const used = spent > 0 ? 1 : 0;
    return { fraction: used, over, percent: used * 100 };
  }
  const ratio = Math.max(spent / budget, 0);
  return { fraction: Math.min(ratio, 1), over, percent: Math.round(ratio * 100) };
}
