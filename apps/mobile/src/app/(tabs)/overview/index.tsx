import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";
import { SecondaryButton } from "@/ui/native/button";

export default function OverviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen testID="screen-home">
      <Card testID="overview-savings-card">
        <CardHeader>
          <CardTitle>{t("nav.savings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>{t("scaffold.message")}</Text>
          <SecondaryButton
            testID="overview-open-savings"
            label={t("nav.savings")}
            onPress={() => router.push("/(tabs)/overview/savings")}
          />
        </CardContent>
      </Card>
    </Screen>
  );
}
