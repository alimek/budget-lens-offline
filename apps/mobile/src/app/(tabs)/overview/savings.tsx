import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function SavingsScreen() {
  const { t } = useTranslation();
  return (
    <View testID="screen-savings" collapsable={false} className="flex-1 bg-white p-6 dark:bg-black">
      <Text
        accessibilityRole="header"
        className="text-2xl font-semibold text-black dark:text-white"
      >
        {t("nav.savings")}
      </Text>
    </View>
  );
}
