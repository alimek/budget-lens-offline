/**
 * LEGACY REFERENCE – formatting and parsing helpers from the old Budget Lens repository:
 * - formatCurrency / formatCurrencyCompact / monthNames: apps/web/src/lib/mock-data.ts
 *   (formatCurrency is duplicated verbatim in apps/web/src/lib/hooks/use-budget.ts)
 * - parseBalanceInput: inline expression from apps/web/src/components/budget/update-balance-sheet.tsx
 * - valueInPlnFromCurrency: inline expression from apps/web/src/components/budget/add-saving-dialog.tsx
 * The Polish month names are legacy user-facing data and are kept as-is.
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k`;
  }
  return amount.toString();
}

export const monthNames = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

/** `Number.parseFloat(balance.replace(/[^0-9.-]/g, ""))` from update-balance-sheet.tsx. */
export function parseBalanceInput(balance: string): number {
  return Number.parseFloat(balance.replace(/[^0-9.-]/g, ""));
}

/** `(Number.parseFloat(amountInCurrency) * rate).toFixed(2)` from add-saving-dialog.tsx. */
export function valueInPlnFromCurrency(amountInCurrency: string, rate: number): string {
  return (Number.parseFloat(amountInCurrency) * rate).toFixed(2);
}
