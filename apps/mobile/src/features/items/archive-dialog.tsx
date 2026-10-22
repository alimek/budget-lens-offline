// Archiving an item from the list (#112): the confirmation of #63 and the write behind it. The row leaves the
// list through the live read, so nothing here refreshes anything.
import { archiveItem } from "@budget-lens/db";
import { randomUUID } from "expo-crypto";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo } from "react-native";
import { useDatabase } from "@/db/database-provider";
import { AppAlert } from "@/ui/native/alert";
import type { ItemRow } from "./item-rows";

export interface ArchiveDialogProps {
  /** The row being confirmed, or none while the dialog is closed. */
  readonly row: ItemRow | null;
  readonly onClose: () => void;
}

/**
 * The archive confirmation.
 *
 * There is no Snackbar wrapper in the app yet, so the result is announced on both platforms instead (#63 asked
 * for one on Android). Archiving keeps the item and its versions (#81); a real delete is #63's open point 1.
 */
export function ArchiveDialog({ row, onClose }: ArchiveDialogProps) {
  const { t } = useTranslation();
  const db = useDatabase();
  const confirm = () => {
    if (row !== null) {
      // The clock and the new version id are injected; the repository reads no clock of its own (#81).
      archiveItem(db, row.id, { now: () => Date.now(), newId: randomUUID });
      AccessibilityInfo.announceForAccessibility(t("items.archive.done"));
    }
    onClose();
  };
  return (
    <AppAlert
      testID="item-archive-dialog"
      visible={row !== null}
      title={t("items.archive.title", { name: row?.name ?? "" })}
      message={t("items.archive.message")}
      confirmLabel={t("items.archive.confirm")}
      cancelLabel={t("common.cancel")}
      destructive
      onConfirm={confirm}
      onDismiss={onClose}
    />
  );
}
