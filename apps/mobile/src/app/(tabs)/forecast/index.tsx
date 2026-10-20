import { useTranslation } from "react-i18next";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";

export default function ForecastScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="screen-forecast">
      <Text>{t("scaffold.message")}</Text>
    </Screen>
  );
}
