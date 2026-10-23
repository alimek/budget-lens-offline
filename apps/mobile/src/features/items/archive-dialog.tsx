// Archiving an item from the list (#112): the confirmation of #63 and the write behind it. The row leaves the
// list through the live read, so nothing here refreshes anything.
import { archiveItem } from "@budget-lens/db";
import { randomUUID } from "expo-crypto";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDatabase } from "@/db/database-provider";
import { AppAlert } from "@/ui/native/alert";
import { AppSnackbar } from "@/ui/native/snackbar";
import type { ItemRow } from "./item-rows";

/** What the confirmation needs to name: an item's id and its name, which the list row and the edit form both have. */
export type ArchivableItem = Pick<ItemRow, "id" | "name">;

export interface ArchiveDialogProps {
  /** The item being confirmed, or none while the dialog is closed. */
  readonly row: ArchivableItem | null;
  readonly onClose: () => void;
}

/**
 * The archive confirmation.
 *
 * A finished archive is confirmed by the `Snackbar` of #63 on Android and by an accessibility announcement on
 * iOS (the same `AppSnackbar`, which is the announcement there). A write that throws is reported rather than left
 * to crash the press handler: the item is still in the list and the user is told so.
 *
 * Archiving keeps the item and its versions (#81); a real delete is #63's open point 1, and there is no Undo (#63,
 * decision 3).
 */
export function ArchiveDialog({ row, onClose }: ArchiveDialogProps) {
  const { t } = useTranslation("items");
  const { t: tShared } = useTranslation();
  const db = useDatabase();
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const forgetNotice = useCallback(() => setNotice(undefined), []);

  const confirm = () => {
    if (row !== null) {
      try {
        // The clock and the new version id are injected; the repository reads no clock of its own (#81).
        archiveItem(db, row.id, { now: () => Date.now(), newId: randomUUID });
        setNotice(t("archive.done"));
      } catch {
        setFailed(true);
      }
    }
    onClose();
  };

  return (
    <>
      <AppAlert
        testID="item-archive-dialog"
        visible={row !== null}
        title={t("archive.title", { name: row?.name ?? "" })}
        message={t("archive.message")}
        confirmLabel={t("archive.confirm")}
        cancelLabel={tShared("common.cancel")}
        destructive
        onConfirm={confirm}
        onDismiss={onClose}
      />
      <AppAlert
        testID="item-archive-failed"
        visible={failed}
        title={t("archive.failedTitle")}
        message={t("archive.failedMessage")}
        confirmLabel={tShared("common.ok")}
        onConfirm={() => setFailed(false)}
        onDismiss={() => setFailed(false)}
      />
      <AppSnackbar testID="item-archive-notice" message={notice} onShown={forgetNotice} />
    </>
  );
}
