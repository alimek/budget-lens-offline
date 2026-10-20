import { useTranslation } from "react-i18next";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";

export default function ItemsScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="screen-items">
      <Text>{t("scaffold.message")}</Text>
    </Screen>
  );
}
