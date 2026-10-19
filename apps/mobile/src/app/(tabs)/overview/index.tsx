import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";
import { SavingsButton } from "../../../ui/native/savings-button";

export default function Screen() {
  const { t } = useTranslation();
  return (
    <ScrollView
      testID="screen-home"
      collapsable={false}
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="gap-4 p-6"
    >
      <Text className="text-black dark:text-white">{t("scaffold.message")}</Text>
      <SavingsButton />
    </ScrollView>
  );
}
