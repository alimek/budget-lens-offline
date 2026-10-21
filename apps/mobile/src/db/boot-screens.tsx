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
 * The ways the database can refuse to start (#34 §2, #60). #60 has no approved mockups yet, so these are built
 * from the design-system components alone, with the `screen-<name>` test IDs; the final look is follow-up.
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
        <CardTitle accessibilityRole="header">{title}</CardTitle>
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

/** Why the budget could not be opened, deciding what the screen offers. */
export type RecoveryReason =
  | "key_missing"
  | "migration_failed"
  | "restore_failed"
  | "state_unrecognized";

/** Whether the body says the data is intact, which is what makes repeating the attempt the primary action. */
function isIntact(reason: RecoveryReason): boolean {
  return reason === "migration_failed" || reason === "restore_failed";
}

/**
 * The two ways out, with the weight and the order the reason calls for: after a failed migration the data is
 * intact and trying again is the primary action, where the key is gone starting over is the only way forward and
 * stays primary, with a retry beside it (#75 R4, #60 screens B and C).
 */
function RecoveryActions({
  intact,
  askStartOver,
  onRetry,
}: {
  readonly intact: boolean;
  readonly askStartOver: () => void;
  readonly onRetry: () => void;
}) {
  const { t } = useTranslation();
  const retry = intact ? (
    <PrimaryButton testID="recovery-retry" label={t("common.retry")} onPress={onRetry} />
  ) : (
    <SecondaryButton testID="recovery-retry" label={t("common.retry")} onPress={onRetry} />
  );
  const startOver = intact ? (
    <SecondaryButton
      testID="recovery-start-over"
      label={t("boot.recovery.startOver")}
      onPress={askStartOver}
    />
  ) : (
    <PrimaryButton
      testID="recovery-start-over"
      label={t("boot.recovery.startOver")}
      onPress={askStartOver}
    />
  );
  return intact ? (
    <>
      {retry}
      {startOver}
    </>
  ) : (
    <>
      {startOver}
      {retry}
    </>
  );
}

/**
 * The budget is there and cannot be opened: its key is gone, an update was undone and its copy could not be put
 * back either, or the files on the device are in a state the app does not recognise.
 *
 * Either way the budget file is kept, and restoring a backup is E8 (#96/#97), so no restore action is offered
 * while it does not exist. The wording is provisional until #60 approves its mockups.
 */
export function RecoveryScreen({
  reason,
  onRetry,
  onStartOver,
}: {
  readonly reason: RecoveryReason;
  readonly onRetry: () => void;
  readonly onStartOver: () => void;
}) {
  const { t } = useTranslation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const body = {
    key_missing: t("boot.recovery.keyMissing"),
    migration_failed: t("boot.recovery.migrationFailed"),
    restore_failed: t("boot.recovery.restoreFailed"),
    state_unrecognized: t("boot.recovery.stateUnrecognized"),
  }[reason];
  return (
    <Screen testID="screen-recovery">
      <StopCard
        testID="recovery-card"
        title={t("boot.recovery.title")}
        bodyTestID="recovery-message"
      >
        {body}
      </StopCard>
      <Text testID="recovery-keeps-file" variant="footnote">
        {t("boot.recovery.keepsFile")}
      </Text>
      <RecoveryActions
        intact={isIntact(reason)}
        askStartOver={() => setConfirmVisible(true)}
        onRetry={onRetry}
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
 * it, so the screen only repeats the attempt (#34 §2: a rejected read is not a missing key, and #75 R3 keeps a
 * busy or failing device away from the destructive screen).
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
  return <RecoveryScreen reason={state.kind} onRetry={onRetry} onStartOver={onStartOver} />;
}
