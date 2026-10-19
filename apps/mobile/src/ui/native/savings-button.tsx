import { Button, Host } from "@expo/ui";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export function SavingsButton() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Host matchContents>
      <Button
        testID="overview-open-savings"
        label={t("nav.savings")}
        onPress={() => router.push("/(tabs)/overview/savings")}
      />
    </Host>
  );
}
