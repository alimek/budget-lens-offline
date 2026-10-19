import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function Screen() {
  const { t } = useTranslation();
  return (
    <View
      testID="screen-forecast"
      collapsable={false}
      className="flex-1 gap-4 bg-white p-6 dark:bg-black"
    >
      <Text
        accessibilityRole="header"
        className="text-2xl font-semibold text-black dark:text-white"
      >
        {t("nav.tabs.forecast")}
      </Text>
      <Text className="text-black dark:text-white">{t("scaffold.message")}</Text>
    </View>
  );
}
