import { Redirect, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { type BootAction, type BootOutcome, type BootReason, BootScreen } from "@/db/boot-screens";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";

const doNothing = () => undefined;

/** Every screen of #60 in the state named in the URL, with the actions of a preview that leads nowhere. */
function preview(
  reason: BootReason,
  pending: BootAction | null = null,
  outcome: BootOutcome | null = null,
): ReactNode {
  return (
    <BootScreen
      reason={reason}
      pending={pending}
      outcome={outcome}
      onRetry={doNothing}
      onStartOver={doNothing}
    />
  );
}

const PREVIEWS: Record<string, ReactNode> = {
  recovery: preview("key_missing"),
  "migration-failed": preview("migration_failed"),
  "restore-failed": preview("restore_failed"),
  "state-unrecognized": preview("state_unrecognized"),
  "encryption-unavailable": preview("encryption_unavailable"),
  "storage-unreachable": preview("storage_unreachable"),
  // The states of #217 R4, which a real attempt only shows for a moment.
  retrying: preview("key_missing", "retry"),
  "starting-over": preview("storage_unreachable", "start_over"),
  "status-failed": preview("key_missing", null, "failed"),
  "start-over-blocked": preview("storage_unreachable", null, "start_over_blocked"),
};

function BootScreenPreview({ screen }: { readonly screen: string }) {
  const { t } = useTranslation();
  const previewScreen = PREVIEWS[screen];
  if (previewScreen !== undefined) {
    return previewScreen;
  }
  return (
    <Screen testID="screen-dev-boot-screen">
      <Text testID="dev-boot-screen-unknown">{t("dev.bootScreen.unknown", { screen })}</Text>
    </Screen>
  );
}

/**
 * Development-only preview of the boot screens (#75, #217), which a normal launch shows only when the database
 * refuses to open. Open one with `budget-lens:///dev/boot-screen?screen=recovery` so a state can be seen and
 * screenshotted; in a release build the route redirects away. A real unreadable database is reached through
 * `/dev/forget-key` instead (#75 R6).
 */
export default function DevBootScreen() {
  const { screen } = useLocalSearchParams<{ readonly screen?: string }>();
  if (!__DEV__) {
    return <Redirect href="/(tabs)/overview" />;
  }
  return <BootScreenPreview screen={screen ?? ""} />;
}
