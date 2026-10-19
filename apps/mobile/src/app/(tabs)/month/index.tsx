import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useAppStore } from "../../../state/app-store";

export default function Screen() {
  const { t } = useTranslation();
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  return (
    <View
      testID="screen-month"
      collapsable={false}
      className="flex-1 gap-4 bg-white p-6 dark:bg-black"
    >
      <Text
        accessibilityRole="header"
        className="text-2xl font-semibold text-black dark:text-white"
      >
        {t("nav.tabs.month")}
      </Text>
      <Text className="text-black dark:text-white">{t("scaffold.message")}</Text>
      <Text className="text-black dark:text-white">
        {t("scaffold.selectedMonth", { month: selectedMonth })}
      </Text>
    </View>
  );
}
