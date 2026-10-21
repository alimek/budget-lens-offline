import { Redirect, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  EncryptionUnavailableScreen,
  RecoveryScreen,
  StorageUnreachableScreen,
} from "@/db/boot-screens";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";

const doNothing = () => undefined;

const PREVIEWS: Record<string, ReactNode> = {
  recovery: <RecoveryScreen reason="key_missing" onStartOver={doNothing} />,
  "migration-failed": <RecoveryScreen reason="migration_failed" onStartOver={doNothing} />,
  "encryption-unavailable": <EncryptionUnavailableScreen />,
  "storage-unreachable": <StorageUnreachableScreen onRetry={doNothing} />,
};

function BootScreenPreview({ screen }: { readonly screen: string }) {
  const { t } = useTranslation();
  const preview = PREVIEWS[screen];
  if (preview !== undefined) {
    return preview;
  }
  return (
    <Screen testID="screen-dev-boot-screen">
      <Text testID="dev-boot-screen-unknown">{t("dev.bootScreen.unknown", { screen })}</Text>
    </Screen>
  );
}

/**
 * Development-only preview of the boot screens (#75), which a normal launch shows only when the database refuses
 * to open. Open one with `budget-lens:///dev/boot-screen?screen=recovery` so a state can be seen and
 * screenshotted; in a release build the route redirects away.
 */
export default function DevBootScreen() {
  const { screen } = useLocalSearchParams<{ readonly screen?: string }>();
  if (!__DEV__) {
    return <Redirect href="/(tabs)/overview" />;
  }
  return <BootScreenPreview screen={screen ?? ""} />;
}
