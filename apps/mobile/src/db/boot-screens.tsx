import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Platform, View } from "react-native";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";
import { AppAlert } from "@/ui/native/alert";
import { PrimaryButton } from "@/ui/native/button";
import { DestructiveButton } from "@/ui/native/destructive-button";
import { ProgressIndicator } from "@/ui/native/progress-indicator";
import { StatusIcon } from "@/ui/native/status-icon";
import type { StatusIconName } from "@/ui/native/types";
import { useDelayedFlag } from "@/ui/use-delayed-flag";
import { useThemeColors } from "@/ui/use-theme";

/**
 * The screens that stand in for the app while the database stays closed (#60, revised design of 2026-10-22).
 *
 * Every one of them says, in plain words, what went wrong and what the user can do about it, and none of them is
 * a dead end: the ways out are stacked full width under the steps, "Try again" is always the primary action and
 * "Start over" – the only action that can cost anything – is the borderless destructive button underneath and
 * never runs without the native confirmation. No technical error code is shown anywhere. The wording is in the
 * `boot.*` namespace, English and Polish.
 */

/** Why the app has not reached the database. */
export type BootReason =
  | "key_missing"
  | "storage_unreachable"
  | "encryption_unavailable"
  | "migration_failed"
  | "restore_failed"
  | "state_unrecognized";

/** What the user asked for and the app is still doing (#217 R4). */
export type BootAction = "retry" | "start_over";

/** What a finished attempt has to say once nothing is running any more (#217 R4). */
export type BootOutcome = "failed" | "start_over_blocked";

/** Every `boot.*` string these screens use, so a key missing from the English resources fails the typecheck. */
type BootMessage =
  | "boot.whatYouCanDo"
  | "boot.startOver"
  | "boot.store.appStore"
  | "boot.store.playStore"
  | "boot.steps.tapRetry"
  | "boot.steps.restart"
  | "boot.steps.checkUpdate"
  | "boot.steps.lastResort"
  | "boot.keyMissing.title"
  | "boot.keyMissing.body"
  | "boot.keyMissing.step1"
  | "boot.keyMissing.step2"
  | "boot.keyMissing.step3"
  | "boot.keyMissing.confirmTitle"
  | "boot.keyMissing.confirmBody"
  | "boot.storageUnreachable.title"
  | "boot.storageUnreachable.body"
  | "boot.storageUnreachable.step1"
  | "boot.storageUnreachable.step2"
  | "boot.storageUnreachable.step3"
  | "boot.storageUnreachable.step4"
  | "boot.storageUnreachable.confirmTitle"
  | "boot.storageUnreachable.confirmBody"
  | "boot.storageUnreachable.startOverBlocked"
  | "boot.migrationFailed.title"
  | "boot.migrationFailed.body"
  | "boot.restoreFailed.body"
  | "boot.stateUnrecognized.title"
  | "boot.stateUnrecognized.body"
  | "boot.encryptionUnavailable.title"
  | "boot.encryptionUnavailable.body"
  | "boot.encryptionUnavailable.step1"
  | "boot.encryptionUnavailable.step2"
  | "boot.encryptionUnavailable.noStartOver"
  | "boot.status.retrying"
  | "boot.status.failed"
  | "boot.status.startingOver";

/** The copy and the ways out of one screen, as keys. */
interface BootSpec {
  /** Screen root test ID, `screen-<name>`. */
  readonly root: string;
  /** Prefix of every test ID of this screen: its buttons, steps and status line. */
  readonly prefix: string;
  readonly icon: StatusIconName;
  readonly title: BootMessage;
  readonly body: BootMessage;
  /** The numbered fix steps, in order. */
  readonly steps: readonly BootMessage[];
  /** The keys of the confirmation "Start over" asks for, or `null` on the one screen without it. */
  readonly confirm: { readonly title: BootMessage; readonly body: BootMessage } | null;
  /** A last line under the actions, for the screen that has to explain why it offers less. */
  readonly note: BootMessage | null;
}

const RECOVERY_STEPS = [
  "boot.steps.tapRetry",
  "boot.steps.restart",
  "boot.steps.checkUpdate",
  "boot.steps.lastResort",
] as const;

const SPECS: Record<BootReason, BootSpec> = {
  key_missing: {
    root: "screen-recovery",
    prefix: "recovery",
    icon: "key",
    title: "boot.keyMissing.title",
    body: "boot.keyMissing.body",
    steps: ["boot.keyMissing.step1", "boot.keyMissing.step2", "boot.keyMissing.step3"],
    confirm: { title: "boot.keyMissing.confirmTitle", body: "boot.keyMissing.confirmBody" },
    note: null,
  },
  storage_unreachable: {
    root: "screen-storage-unreachable",
    prefix: "storage-unreachable",
    icon: "lock",
    title: "boot.storageUnreachable.title",
    body: "boot.storageUnreachable.body",
    steps: [
      "boot.storageUnreachable.step1",
      "boot.storageUnreachable.step2",
      "boot.storageUnreachable.step3",
      "boot.storageUnreachable.step4",
    ],
    confirm: {
      title: "boot.storageUnreachable.confirmTitle",
      body: "boot.storageUnreachable.confirmBody",
    },
    note: null,
  },
  // Start over could never help here: the fresh database would meet the same guard, so this is the one screen
  // that does not offer it (#60 decision, screen 09). Its ways out arrive with the store link of R3.
  encryption_unavailable: {
    root: "screen-encryption-unavailable",
    prefix: "encryption-unavailable",
    icon: "shield",
    title: "boot.encryptionUnavailable.title",
    body: "boot.encryptionUnavailable.body",
    steps: ["boot.encryptionUnavailable.step1", "boot.encryptionUnavailable.step2"],
    confirm: null,
    note: "boot.encryptionUnavailable.noStartOver",
  },
  migration_failed: {
    root: "screen-recovery",
    prefix: "recovery",
    icon: "warning",
    title: "boot.migrationFailed.title",
    body: "boot.migrationFailed.body",
    steps: RECOVERY_STEPS,
    confirm: {
      title: "boot.storageUnreachable.confirmTitle",
      body: "boot.storageUnreachable.confirmBody",
    },
    note: null,
  },
  restore_failed: {
    root: "screen-recovery",
    prefix: "recovery",
    icon: "warning",
    title: "boot.migrationFailed.title",
    body: "boot.restoreFailed.body",
    steps: RECOVERY_STEPS,
    confirm: {
      title: "boot.storageUnreachable.confirmTitle",
      body: "boot.storageUnreachable.confirmBody",
    },
    note: null,
  },
  state_unrecognized: {
    root: "screen-recovery",
    prefix: "recovery",
    icon: "error",
    title: "boot.stateUnrecognized.title",
    body: "boot.stateUnrecognized.body",
    steps: RECOVERY_STEPS,
    confirm: {
      title: "boot.storageUnreachable.confirmTitle",
      body: "boot.storageUnreachable.confirmBody",
    },
    note: null,
  },
};

/** `{{store}}`: the store of this platform, in the words the sentence needs (#60 copy notes). */
function useStoreName(): string {
  const { t } = useTranslation();
  const key: BootMessage = Platform.OS === "ios" ? "boot.store.appStore" : "boot.store.playStore";
  return t(key);
}

/** The decorative glyph of the screen, named for the situation and hidden from the screen reader. */
function Heading({ name }: { readonly name: StatusIconName }) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <StatusIcon name={name} />
    </View>
  );
}

/** "What you can do" and the numbered steps that follow it, as the list a screen reader can walk (#60). */
function FixSteps({
  testID,
  steps,
}: {
  readonly testID: string;
  readonly steps: readonly BootMessage[];
}) {
  const { t } = useTranslation();
  const store = useStoreName();
  return (
    <>
      <Text variant="headline" role="heading" aria-level={2} className="mt-6">
        {t("boot.whatYouCanDo")}
      </Text>
      <View testID={testID} role="list" className="mt-2 gap-2">
        {steps.map((step, index) => (
          <View key={step} role="listitem" className="flex-row">
            <Text variant="body" className="w-6">
              {String(index + 1)}
            </Text>
            <Text variant="body" className="flex-1">
              {t(step, { store })}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

/**
 * The line that says what is happening or what the last attempt ended with. It is read out when it changes:
 * a polite live region on Android, and an explicit announcement on iOS, which has none.
 */
function StatusLine({ testID, text }: { readonly testID: string; readonly text: string }) {
  useEffect(() => {
    if (Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibility(text);
    }
  }, [text]);
  return (
    <Text testID={testID} variant="subheadline" accessibilityLiveRegion="polite">
      {text}
    </Text>
  );
}

/** What each thing the screen is doing, or just did, has to say in the status line. */
const STATUS_KEYS = {
  retry: "boot.status.retrying",
  start_over: "boot.status.startingOver",
  failed: "boot.status.failed",
  start_over_blocked: "boot.storageUnreachable.startOverBlocked",
} as const satisfies Record<BootAction | BootOutcome, BootMessage>;

/**
 * What the status line says: an attempt that is running outranks what the previous one left to say, and
 * between the two there is nothing to report.
 */
function useBootStatus(pending: BootAction | null, outcome: BootOutcome | null): string | null {
  const { t } = useTranslation();
  const stated = pending ?? outcome;
  return stated === null ? null : t(STATUS_KEYS[stated]);
}

/** The spinner of a step that is taking its time, beside the status line (#58: nothing before 300 ms). */
function StatusRow({
  testID,
  text,
  spinner,
}: {
  readonly testID: string;
  readonly text: string;
  readonly spinner: boolean;
}) {
  const theme = useThemeColors();
  return (
    <View className="mb-3 flex-row items-center gap-2">
      {spinner ? <ProgressIndicator color={theme.primary} trackColor={theme.muted} /> : null}
      <StatusLine testID={testID} text={text} />
    </View>
  );
}

/**
 * The ways out, stacked full width and always in the same order (#60): "Try again" is the primary action on
 * every screen, and "Start over" – where the budget can be set aside at all – is the borderless destructive
 * button underneath it, never running without the confirmation. Both go dark while the app is working (#217 R4).
 */
function BootActions({
  spec,
  busy,
  onRetry,
  onStartOver,
}: {
  readonly spec: BootSpec;
  readonly busy: boolean;
  readonly onRetry: () => void;
  readonly onStartOver: () => void;
}) {
  const { t } = useTranslation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  return (
    <>
      <View className="gap-3">
        <PrimaryButton
          testID={`${spec.prefix}-retry`}
          label={t("common.retry")}
          onPress={onRetry}
          disabled={busy}
          fullWidth
        />
        {spec.confirm === null ? null : (
          <DestructiveButton
            testID={`${spec.prefix}-start-over`}
            label={t("boot.startOver")}
            onPress={() => setConfirmVisible(true)}
            disabled={busy}
            fullWidth
          />
        )}
      </View>
      {spec.confirm === null ? null : (
        <AppAlert
          visible={confirmVisible}
          testID={`${spec.prefix}-start-over-alert`}
          title={t(spec.confirm.title)}
          message={t(spec.confirm.body)}
          confirmLabel={t("boot.startOver")}
          cancelLabel={t("common.cancel")}
          destructive
          onConfirm={onStartOver}
          onDismiss={() => setConfirmVisible(false)}
        />
      )}
    </>
  );
}

/**
 * One boot screen: the icon, the title and the body of its reason, the steps the user can take, the status line
 * of what the app is doing, and the ways out (#60).
 *
 * While `pending` is set, the screen stays exactly where it is: both buttons are disabled, and after 300 ms the
 * spinner and "Trying again…" / "Setting up a new budget…" appear (#58 rule, #217 R4). `outcome` is what the
 * attempt that just finished left to say.
 */
export function BootScreen({
  reason,
  pending,
  outcome,
  onRetry,
  onStartOver,
}: {
  readonly reason: BootReason;
  readonly pending: BootAction | null;
  readonly outcome: BootOutcome | null;
  readonly onRetry: () => void;
  readonly onStartOver: () => void;
}) {
  const { t } = useTranslation();
  const spec = SPECS[reason];
  const busy = pending !== null;
  const showSpinner = useDelayedFlag(busy);
  const status = useBootStatus(pending, outcome);
  return (
    <Screen testID={spec.root} contentClassName="flex-grow gap-0 px-4 pt-16 pb-6">
      <Heading name={spec.icon} />
      <Text testID={`${spec.prefix}-title`} variant="title-1" className="mt-6">
        {t(spec.title)}
      </Text>
      <Text testID={`${spec.prefix}-body`} variant="body" className="mt-3">
        {t(spec.body)}
      </Text>
      <FixSteps testID={`${spec.prefix}-steps`} steps={spec.steps} />
      {/* Pins the actions low on a tall screen and collapses so the whole page scrolls at large text. */}
      <View className="min-h-8" />
      {status === null ? null : (
        <StatusRow testID={`${spec.prefix}-status`} text={status} spinner={showSpinner} />
      )}
      <BootActions spec={spec} busy={busy} onRetry={onRetry} onStartOver={onStartOver} />
      {spec.note === null ? null : (
        <Text variant="footnote" className="mt-3">
          {t(spec.note)}
        </Text>
      )}
    </Screen>
  );
}
