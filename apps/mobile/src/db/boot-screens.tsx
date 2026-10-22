import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";
import { AppAlert } from "@/ui/native/alert";
import { PrimaryButton, SecondaryButton } from "@/ui/native/button";

/**
 * The one screen the database can lead to (#34 §2, #60, #242): it is there and cannot be opened or migrated.
 * #60 has no approved mockups yet, so this is built from the design-system components alone, with the
 * `screen-<name>` test ID; the final look is follow-up.
 */
export function RecoveryScreen({
  onRetry,
  onStartOver,
}: {
  readonly onRetry: () => void;
  readonly onStartOver: () => void;
}) {
  const { t } = useTranslation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  return (
    <Screen testID="screen-recovery">
      <Card testID="recovery-card">
        <CardHeader>
          <CardTitle accessibilityRole="header">{t("boot.recovery.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text testID="recovery-message">{t("boot.recovery.body")}</Text>
        </CardContent>
      </Card>
      <Text testID="recovery-keeps-file" variant="footnote">
        {t("boot.recovery.keepsFile")}
      </Text>
      <PrimaryButton testID="recovery-retry" label={t("common.retry")} onPress={onRetry} />
      <SecondaryButton
        testID="recovery-start-over"
        label={t("boot.recovery.startOver")}
        onPress={() => setConfirmVisible(true)}
      />
      <AppAlert
        visible={confirmVisible}
        testID="recovery-start-over-alert"
        title={t("boot.recovery.confirmTitle")}
        message={t("boot.recovery.confirmBody")}
        confirmLabel={t("boot.recovery.confirmAction")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={onStartOver}
        onDismiss={() => setConfirmVisible(false)}
      />
    </Screen>
  );
}
