import { useTranslation } from "react-i18next";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";
import { useAppStore } from "../../../state/app-store";

export default function MonthScreen() {
  const { t } = useTranslation();
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  return (
    <Screen testID="screen-month">
      <Text>{t("scaffold.message")}</Text>
      <Text variant="subheadline">{t("scaffold.selectedMonth", { month: selectedMonth })}</Text>
    </Screen>
  );
}
