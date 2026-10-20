import { type MinorUnits, toMinorUnits } from "@budget-lens/core";
import { Redirect } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { type CalendarDate, formatCalendarDate } from "@/ui/calendar-date";
import { AddButton } from "@/ui/native/add-button";
import { GroupedList, ListSection, TransactionRow } from "@/ui/native/list";
import { useLanguage } from "@/ui/use-language";

interface ExampleRow {
  id: string;
  title: string;
  amount: MinorUnits;
  paid: boolean;
  due?: CalendarDate;
}

type SetRows = (update: (rows: ExampleRow[]) => ExampleRow[]) => void;

/** Dev-only example of the native grouped list, transaction rows and the add button (#182). */
export default function DesignSystemListScreen() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const [expenses, setExpenses] = useState<ExampleRow[]>(() => [
    {
      id: "rent",
      title: t("dev.designSystem.rent"),
      amount: toMinorUnits(-200_000),
      paid: false,
      due: "2026-10-10",
    },
    {
      id: "internet",
      title: t("dev.designSystem.internet"),
      amount: toMinorUnits(-8_999),
      paid: true,
      due: "2026-10-15",
    },
  ]);
  const [income, setIncome] = useState<ExampleRow[]>(() => [
    {
      id: "salary",
      title: t("dev.designSystem.salary"),
      amount: toMinorUnits(850_000),
      paid: true,
    },
  ]);
  if (!__DEV__) return <Redirect href="/" />;

  const renderRow = (row: ExampleRow, setRows: SetRows) => (
    <TransactionRow
      key={row.id}
      testID={`ds-row-${row.id}`}
      title={row.title}
      meta={
        row.due ? t("dev.designSystem.due", { date: formatCalendarDate(row.due, lang) }) : undefined
      }
      amount={row.amount}
      paid={row.paid}
      onPaidChange={(paid) =>
        setRows((rows) => rows.map((other) => (other.id === row.id ? { ...other, paid } : other)))
      }
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
    </View>
  );
}
