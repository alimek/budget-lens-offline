import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";
import { SecondaryButton } from "@/ui/native/button";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen testID="screen-settings">
      <Card>
        <CardContent>
          <Text>{t("scaffold.message")}</Text>
        </CardContent>
      </Card>
      {/* Disclosure of the EAS Update check (ADR 0013); the onboarding privacy text reuses `privacy.updates`. */}
      <Card testID="settings-privacy">
        <CardHeader>
          <CardTitle>{t("privacy.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text testID="settings-privacy-updates">{t("privacy.updates")}</Text>
        </CardContent>
      </Card>
      {__DEV__ ? (
        <SecondaryButton
          testID="settings-open-design-system"
          label={t("dev.designSystem.open")}
          onPress={() => router.push("/dev/design-system")}
        />
      ) : null}
    </Screen>
  );
}
