import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";
import { useAppStore } from "../../../state/app-store";

export default function Screen() {
  const { t } = useTranslation();
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  return (
    <ScrollView
      testID="screen-month"
      collapsable={false}
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="gap-4 p-6"
    >
      <Text className="text-black dark:text-white">{t("scaffold.message")}</Text>
      <Text className="text-black dark:text-white">
        {t("scaffold.selectedMonth", { month: selectedMonth })}
      </Text>
    </ScrollView>
  );
}
