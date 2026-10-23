// The dialogs on top of the item sheet (#63, #64): the discard confirmation, the orphaned one-off changes that a
// save is about to remove, the month that closed while the user was typing, and the one generic save failure.
// A code is never shown: each of these says what happened in the app language and what to do next.
import type { OccurrenceOverride, RuleEditPlan, YearMonth } from "@budget-lens/core";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { AppAlert } from "@/ui/native/alert";
import { type ArchivableItem, ArchiveDialog } from "./archive-dialog";
import type { SaveFailure } from "./item-sheet-model";

/** The sheet's own dialogs; the archive confirmation is #112's and is rendered by the sheet itself. */
export type SheetDialog = "none" | "discard" | "orphans";

export interface SheetDialogsProps {
  /** Which of the sheet's own dialogs is open. */
  readonly dialog: SheetDialog;
  /** The dry run whose orphaned one-off changes are about to be removed, if the orphans dialog is open. */
  readonly plan: RuleEditPlan | undefined;
  /** The month that closed under the user, with what to say about it; none while the last save succeeded. */
  readonly failure: SaveFailure | undefined;
  /** The month the sheet is anchored to, which a one-time item's closed month reads as (#64). */
  readonly displayMonth: YearMonth;
  readonly onCloseDialog: () => void;
  readonly onDiscard: () => void;
  readonly onOrphansConfirmed: () => void;
  /** The month-closed recovery of #64: the picker is recomputed and the inputs stay as they are. */
  readonly onMonthPicked: (() => void) | undefined;
  /** Acknowledge a failure; a one-time item that has just closed becomes read-only behind this. */
  readonly onFailureAcknowledged: () => void;
}

/** All of the sheet's dialogs at once: each one is visible only in the state that asks for it. */
export function SheetDialogs(props: SheetDialogsProps) {
  return (
    <>
      <DiscardDialog
        visible={props.dialog === "discard"}
        onDiscard={props.onDiscard}
        onKeep={props.onCloseDialog}
      />
      <OrphansDialog
        visible={props.dialog === "orphans"}
        orphans={props.plan?.orphanedOverrides ?? []}
        onConfirm={props.onOrphansConfirmed}
        onDismiss={props.onCloseDialog}
      />
      <FailureDialog
        failure={props.failure}
        displayMonth={props.displayMonth}
        onMonthPicked={props.onMonthPicked}
        onDismiss={props.onFailureAcknowledged}
      />
    </>
  );
}

/** The discard confirmation of #63, shown when the user closes a form with something in it. */
function DiscardDialog({
  visible,
  onDiscard,
  onKeep,
}: {
  readonly visible: boolean;
  readonly onDiscard: () => void;
  readonly onKeep: () => void;
}) {
  const { t } = useTranslation("items");
  return (
    <AppAlert
      testID="item-discard-dialog"
      visible={visible}
      title={t("discard.title")}
      confirmLabel={t("discard.confirm")}
      cancelLabel={t("discard.keep")}
      destructive
      onConfirm={onDiscard}
      onDismiss={onKeep}
    />
  );
}

interface OrphansDialogProps {
  readonly visible: boolean;
  /** The one-off changes the save is about to remove, because their months are no longer scheduled. */
  readonly orphans: readonly OccurrenceOverride[];
  readonly onConfirm: () => void;
  readonly onDismiss: () => void;
}

/**
 * The confirmation of #40 before a save removes orphaned one-off changes: the months are named nominative and
 * long, joined with a comma (#63, #64).
 */
function OrphansDialog(props: OrphansDialogProps) {
  const { t } = useTranslation("items");
  const { t: tShared } = useTranslation();
  const months = orphanMonths(props.orphans, t);
  return (
    <AppAlert
      testID="item-orphans-dialog"
      visible={props.visible}
      title={t("orphans.title", { count: props.orphans.length })}
      message={t("orphans.message", { months })}
      confirmLabel={t("orphans.confirm")}
      cancelLabel={tShared("common.cancel")}
      destructive
      onConfirm={props.onConfirm}
      onDismiss={props.onDismiss}
    />
  );
}

/** The month-closed recovery, the closed one-time item, and the generic failure: one of the three, or none. */
function FailureDialog({
  failure,
  displayMonth,
  onMonthPicked,
  onDismiss,
}: {
  readonly failure: SaveFailure | undefined;
  readonly displayMonth: YearMonth;
  readonly onMonthPicked: (() => void) | undefined;
  readonly onDismiss: () => void;
}) {
  const { t } = useTranslation("items");
  const { t: tShared } = useTranslation();
  if (failure === undefined) return null;
  if (failure.kind === "month-closed") {
    return (
      <AppAlert
        testID="item-month-closed-dialog"
        visible
        title={t("errors.monthClosed.title", { month: failure.month })}
        message={t("errors.monthClosed.body")}
        confirmLabel={t("errors.monthClosed.action")}
        onConfirm={() => {
          if (onMonthPicked !== undefined) onMonthPicked();
          onDismiss();
        }}
        onDismiss={onDismiss}
      />
    );
  }
  if (failure.kind === "one-time-closed") {
    return (
      <AppAlert
        testID="item-one-time-closed-dialog"
        visible
        title={t("errors.monthClosed.title", { month: displayMonth })}
        message={t("errors.oneTimeClosedNow")}
        confirmLabel={tShared("common.ok")}
        onConfirm={onDismiss}
        onDismiss={onDismiss}
      />
    );
  }
  return (
    <AppAlert
      testID="item-save-failed-dialog"
      visible
      title={t("errors.saveFailed")}
      confirmLabel={tShared("common.ok")}
      onConfirm={onDismiss}
      onDismiss={onDismiss}
    />
  );
}

/** The archive confirmation of #112, reused by the edit form (#63, decision 1: archive, never delete). */
export function SheetArchiveDialog({
  item,
  open,
  onArchived,
}: {
  readonly item: ArchivableItem | undefined;
  readonly open: boolean;
  readonly onArchived: () => void;
}) {
  const row = open && item !== undefined ? item : null;
  return <ArchiveDialog row={row} onClose={onArchived} />;
}

/** The orphaned months as the dialog reads them: nominative, long, joined with ", " (#63, decision 5). */
function orphanMonths(orphans: readonly OccurrenceOverride[], t: TFunction<"items">): string {
  return orphans.map((override) => t("form.monthValue", { month: override.month })).join(", ");
}
