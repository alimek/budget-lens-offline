import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";

export default function Screen() {
  const { t } = useTranslation();
  return (
    <ScrollView
      testID="screen-forecast"
      collapsable={false}
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="gap-4 p-6"
    >
      <Text className="text-black dark:text-white">{t("scaffold.message")}</Text>
    </ScrollView>
  );
}
