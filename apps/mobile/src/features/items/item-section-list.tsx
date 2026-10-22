// The two sections of an items list (#112), shared by the tab and the archived screen: Income first, then
// Expenses, each with its rows and an optional muted note under the last one.
import { useTranslation } from "react-i18next";
import { ListSection } from "@/ui/native/list";
import type { MenuAction } from "@/ui/native/types";
import { ItemRowView } from "./item-row-view";
import type { ItemRow, ItemSections } from "./item-rows";

export interface ItemSectionListProps {
  readonly sections: ItemSections;
  /** Test ID of the Income and of the Expenses section header. */
  readonly sectionTestIds: { readonly income: string; readonly expenses: string };
  /** Test ID prefix of the rows, so each screen's rows are its own. */
  readonly rowTestIdPrefix: string;
  /** Row actions and their handler; absent on a read-only list. */
  readonly actions?: readonly MenuAction<string>[] | undefined;
  readonly onAction?: ((row: ItemRow) => void) | undefined;
  /** Muted note under the last section, e.g. the unreadable-items note. */
  readonly note?: string | undefined;
}

/** Both sections, in the order of #58: income, then expenses. An empty section renders nothing. */
export function ItemSectionList({
  sections,
  sectionTestIds,
  rowTestIdPrefix,
  actions,
  onAction,
  note,
}: ItemSectionListProps) {
  const { t } = useTranslation();
  const rows = (list: readonly ItemRow[]) =>
    list.map((row) => (
      <ItemRowView
        key={row.id}
        row={row}
        actions={actions}
        onAction={onAction === undefined ? undefined : () => onAction(row)}
        testIdPrefix={rowTestIdPrefix}
      />
    ));
  const hasIncome = sections.income.length > 0;
  const hasExpenses = sections.expenses.length > 0;
  return (
    <>
      {hasIncome ? (
        <ListSection
          title={t("items.list.income")}
          testID={sectionTestIds.income}
          footer={hasExpenses ? undefined : note}
        >
          {rows(sections.income)}
        </ListSection>
      ) : null}
      {hasExpenses ? (
        <ListSection
          title={t("items.list.expenses")}
          testID={sectionTestIds.expenses}
          footer={note}
        >
          {rows(sections.expenses)}
        </ListSection>
      ) : null}
    </>
  );
}
