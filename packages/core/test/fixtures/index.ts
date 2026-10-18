import type { LegacyExpense, LegacyIncome } from "../legacy/types";
import expensesJson from "./expenses.json" with { type: "json" };
import incomesJson from "./incomes.json" with { type: "json" };
import nbpResponsesJson from "./nbp-responses.json" with { type: "json" };

/** Expense fixtures covering every legacy expense shape (see expenses.json). */
export const expenses = expensesJson as LegacyExpense[];

/** Income fixtures: recurring with and without frequency, one-time, name-based override. */
export const incomes = incomesJson as LegacyIncome[];

/** Raw NBP table A responses (valid and malformed). */
export const nbpResponses: Record<keyof typeof nbpResponsesJson, unknown> = nbpResponsesJson;

export function byId<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) {
    throw new Error(`Fixture not found: ${id}`);
  }
  return item;
}
