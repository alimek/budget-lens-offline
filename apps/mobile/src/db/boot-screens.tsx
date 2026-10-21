import type { PropsWithChildren } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";
import { AppAlert } from "@/ui/native/alert";
import { PrimaryButton, SecondaryButton } from "@/ui/native/button";
import type { DatabaseBoot } from "./database";

/**
 * The three ways the database can refuse to start (#34 §2, #60). #60 has no approved mockups yet, so these are
 * built from the design-system components alone, with the `screen-<name>` test IDs; the final look is follow-up.
 */

function StopCard({
  testID,
  title,
  bodyTestID,
  children,
}: {
  readonly testID: string;
  readonly title: string;
  readonly bodyTestID?: string;
} & PropsWithChildren) {
  return (
    <Card testID={testID}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children ? <Text testID={bodyTestID}>{children}</Text> : null}</CardContent>
    </Card>
  );
}

/** A build without SQLCipher never opens a budget: `PRAGMA key` there would write plaintext silently. */
export function EncryptionUnavailableScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="screen-encryption-unavailable">
      <StopCard
        testID="encryption-unavailable-card"
        title={t("boot.encryptionUnavailable.title")}
        bodyTestID="encryption-unavailable-message"
      >
        {t("boot.encryptionUnavailable.body")}
      </StopCard>
    </Screen>
  );
}

/**
 * The budget is there, its key is not (or the copy from before a failed migration is back). The only action is to
 * begin again with a new key, which keeps the old file: restoring a backup is E8 (#96/#97) and is not offered
 * here as long as it does not exist.
 */
export function RecoveryScreen({
  reason,
  onStartOver,
}: {
  readonly reason: "key_missing" | "migration_failed";
  readonly onStartOver: () => void;
}) {
  const { t } = useTranslation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  return (
    <Screen testID="screen-recovery">
      <StopCard
        testID="recovery-card"
        title={t("boot.recovery.title")}
        bodyTestID="recovery-message"
      >
        {reason === "key_missing"
          ? t("boot.recovery.keyMissing")
          : t("boot.recovery.migrationFailed")}
      </StopCard>
      <Text testID="recovery-keeps-file" variant="footnote">
        {t("boot.recovery.keepsFile")}
      </Text>
      <PrimaryButton
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

/**
 * SecureStore or the filesystem refused to answer. Nothing here says the data is gone and nothing here can delete
 * it, so the screen only repeats the attempt (#34 §2: a rejected read is not a missing key).
 */
export function StorageUnreachableScreen({ onRetry }: { readonly onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen testID="screen-storage-unreachable">
      <StopCard
        testID="storage-unreachable-card"
        title={t("boot.storageUnreachable.title")}
        bodyTestID="storage-unreachable-message"
      >
        {t("boot.storageUnreachable.body")}
      </StopCard>
      <SecondaryButton
        testID="storage-unreachable-retry"
        label={t("common.retry")}
        onPress={onRetry}
      />
    </Screen>
  );
}

/** What the gate hands the boot screens: every outcome of opening the database except a working database. */
export type BootScreenState =
  | Exclude<DatabaseBoot, { readonly kind: "ready" }>
  | { readonly kind: "opening" };

/** The gate's stand-in for the app while the database is closed (#74, #75). */
export function BootScreen({
  state,
  onRetry,
  onStartOver,
}: {
  readonly state: BootScreenState;
  readonly onRetry: () => void;
  readonly onStartOver: () => void;
}) {
  if (state.kind === "opening") {
    return null;
  }
  if (state.kind === "encryption_unavailable") {
    return <EncryptionUnavailableScreen />;
  }
  if (state.kind === "storage_unreachable") {
    return <StorageUnreachableScreen onRetry={onRetry} />;
  }
  return <RecoveryScreen reason={state.kind} onStartOver={onStartOver} />;
}
