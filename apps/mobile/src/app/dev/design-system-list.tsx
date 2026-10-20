import { type CurrencyCode, type MinorUnits, toMinorUnits } from "@budget-lens/core";
import { Redirect } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { type CalendarDate, formatCalendarDate } from "@/ui/calendar-date";
import { Text } from "@/ui/components/text";
import { AddButton } from "@/ui/native/add-button";
import { AppAlert } from "@/ui/native/alert";
import { GroupedList, ListSection, TransactionRow } from "@/ui/native/list";
import { AppSheet } from "@/ui/native/sheet";
import type { MenuAction } from "@/ui/native/types";
import { useLanguage } from "@/ui/use-language";

interface ExampleRow {
  id: string;
  title: string;
  amount: MinorUnits;
  currency: CurrencyCode;
  paid: boolean;
  due?: CalendarDate;
}

type SetRows = (update: (rows: ExampleRow[]) => ExampleRow[]) => void;

type RowActionKey = "edit" | "delete";

/** The row that a swipe action opened the sheet or the delete alert for. */
interface Target {
  row: ExampleRow;
  setRows: SetRows;
}

/**
 * Dev-only example of the native grouped list, transaction rows, the add button (#182) and the row swipe actions:
 * "Edit" opens a sheet, "Delete" asks in an alert and removes the row (#187).
 */
export default function DesignSystemListScreen() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const [expenses, setExpenses] = useState<ExampleRow[]>(() => [
    {
      id: "rent",
      title: t("dev.designSystem.rent"),
      amount: toMinorUnits(-200_000),
      currency: "PLN",
      paid: false,
      due: "2026-10-10",
    },
    {
      id: "internet",
      title: t("dev.designSystem.internet"),
      amount: toMinorUnits(-1_999),
      // A foreign-currency item: each row is formatted in its own currency.
      currency: "EUR",
      paid: true,
      due: "2026-10-15",
    },
  ]);
  const [income, setIncome] = useState<ExampleRow[]>(() => [
    {
      id: "salary",
      title: t("dev.designSystem.salary"),
      amount: toMinorUnits(850_000),
      currency: "PLN",
      paid: true,
    },
  ]);
  const [editing, setEditing] = useState<Target | null>(null);
  const [deleting, setDeleting] = useState<Target | null>(null);
  if (!__DEV__) return <Redirect href="/" />;

  const rowActions: readonly MenuAction<RowActionKey>[] = [
    { key: "delete", label: t("dev.designSystem.delete"), destructive: true },
    { key: "edit", label: t("dev.designSystem.edit") },
  ];

  const renderRow = (row: ExampleRow, setRows: SetRows) => (
    <TransactionRow
      key={row.id}
      testID={`ds-row-${row.id}`}
      title={row.title}
      meta={
        row.due ? t("dev.designSystem.due", { date: formatCalendarDate(row.due, lang) }) : undefined
      }
      amount={row.amount}
      currency={row.currency}
      paid={row.paid}
      onPaidChange={(paid) =>
        setRows((rows) => rows.map((other) => (other.id === row.id ? { ...other, paid } : other)))
      }
      actions={rowActions}
      onAction={(key) => (key === "edit" ? setEditing : setDeleting)({ row, setRows })}
    />
  );

  const addItem = () =>
    setExpenses((rows) => {
      const number = rows.filter((row) => row.id.startsWith("new-")).length + 1;
      return [
        ...rows,
        {
          id: `new-${number}`,
          title: t("dev.designSystem.newItem", { number }),
          amount: toMinorUnits(-1_000),
          currency: "PLN",
          paid: false,
        },
      ];
    });

  return (
    <View testID="screen-design-system-list" collapsable={false} className="flex-1 bg-background">
      <GroupedList testID="ds-list">
        <ListSection title={t("dev.designSystem.expenses")} testID="ds-list-expenses">
          {expenses.map((row) => renderRow(row, setExpenses))}
        </ListSection>
        <ListSection title={t("dev.designSystem.income")} testID="ds-list-income">
          {income.map((row) => renderRow(row, setIncome))}
        </ListSection>
      </GroupedList>
      <AddButton testID="ds-add-button" label={t("dev.designSystem.addItem")} onPress={addItem} />
      <AppSheet
        testID="ds-edit-sheet"
        visible={editing !== null}
        onDismiss={() => setEditing(null)}
        title={t("dev.designSystem.editing", { title: editing?.row.title ?? "" })}
      >
        <Text variant="body">{t("dev.designSystem.editBody")}</Text>
      </AppSheet>
      <AppAlert
        testID="ds-delete-alert"
        visible={deleting !== null}
        title={t("dev.designSystem.deletePrompt", { title: deleting?.row.title ?? "" })}
        message={t("dev.designSystem.deleteMessage")}
        confirmLabel={t("dev.designSystem.delete")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={() =>
          deleting?.setRows((rows) => rows.filter((other) => other.id !== deleting.row.id))
        }
        onDismiss={() => setDeleting(null)}
      />
    </View>
  );
}
