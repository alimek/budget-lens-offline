// One row of the Items list (#112): the translated copy of `item-row-copy.ts` rendered as a status-less
// `TransactionRow`. The row actions stay a list, so #82 adds "Edit" without touching this file.
import { useTranslation } from "react-i18next";
import { TransactionRow } from "@/ui/native/list";
import type { MenuAction } from "@/ui/native/types";
import { useLanguage } from "@/ui/use-language";
import { itemRowCopy } from "./item-row-copy";
import type { ItemRow } from "./item-rows";

export interface ItemRowViewProps {
  readonly row: ItemRow;
  /** Row actions revealed by the swipe; absent on the read-only archived list. */
  readonly actions?: readonly MenuAction<string>[] | undefined;
  readonly onAction?: ((key: string) => void) | undefined;
  /** Test ID prefix, so the pushed archived list keeps its rows distinguishable. */
  readonly testIdPrefix?: string;
}

/** The row of one item: name, recurrence summary, "Change from" badge and the signed amount. */
export function ItemRowView({
  row,
  actions,
  onAction,
  testIdPrefix = "items-row",
}: ItemRowViewProps) {
  const { t } = useTranslation();
  const copy = itemRowCopy(row, useLanguage(), (key, options) => t(key, { ...options }));
  return (
    <TransactionRow
      testID={`${testIdPrefix}-${row.id}`}
      title={row.name}
      meta={copy.meta}
      badge={copy.badge}
      amount={row.amount}
      currency={row.currency}
      sign="always"
      amountNote={copy.amountNote}
      showStatus={false}
      accessibilityLabel={copy.accessibilityLabel}
      actions={actions}
      onAction={onAction}
    />
  );
}
