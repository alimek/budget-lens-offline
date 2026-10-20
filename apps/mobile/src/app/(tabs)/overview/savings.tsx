import { useTranslation } from "react-i18next";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";

export default function SavingsScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="screen-savings">
      <Text>{t("scaffold.message")}</Text>
    </Screen>
  );
}
