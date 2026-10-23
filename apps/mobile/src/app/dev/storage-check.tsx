import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DatabaseFileInventory } from "@/db/database-files";
import { checkDatabaseFiles } from "@/db/database-files";
import type { CopyCheck, StorageCheckReport } from "@/db/storage-check";
import { useDevEffect } from "@/dev/use-dev-effect";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";

function Row({
  testID,
  label,
  value,
}: {
  readonly testID: string;
  readonly label: string;
  readonly value: string;
}) {
  return <Text testID={testID}>{`${label}: ${value}`}</Text>;
}

/** What one file of the app is: a SQLite database, something that is not one, or nothing at all (#242). */
function formatKey(format: DatabaseFileInventory["database"]) {
  return format === "sqlite"
    ? "dev.storageCheck.sqlite"
    : format === "foreign"
      ? "dev.storageCheck.foreign"
      : "dev.storageCheck.missing";
}

/** What the check did about the pre-migration copy (#242): reported, taken, nothing to take, or refused. */
function copyCheckKey(copy: CopyCheck) {
  return copy === "kept"
    ? "dev.storageCheck.copyKept"
    : copy === "own"
      ? "dev.storageCheck.copyTaken"
      : copy === "absent"
        ? "dev.storageCheck.copyAbsent"
        : "dev.storageCheck.copyFailed";
}

/** The files kept besides the live one: what a failed update left behind and what a "start over" renamed aside. */
function KeptRow({ files }: { readonly files: DatabaseFileInventory["kept"] }) {
  const { t } = useTranslation();
  const value =
    files.map((file) => `${file.name} ${t(formatKey(file.format))}`).join(", ") ||
    t("dev.storageCheck.none");
  return <Row testID="storage-check-kept" label={t("dev.storageCheck.kept")} value={value} />;
}

/**
 * Development-only check (#242, #75 R6) of the files this app owns: the live database and the pre-migration copy
 * beside it, and everything the app is keeping – what a failed update left behind and what a "start over" renamed
 * aside. A copy is taken for real, through the same steps a migration takes, so the screen reports what this
 * build actually writes – but only when there is a database to copy and nothing is being kept already, and the
 * only copy it ever removes is the one it took itself. A copy the file refuses is reported, not thrown. Open it with
 * `budget-lens:///dev/storage-check`; a release build cannot reach the route and the effect runs only under
 * `useDevEffect` (#75 R7).
 */
export default function DevStorageCheck() {
  const { t } = useTranslation();
  const [report, setReport] = useState<StorageCheckReport>();
  useDevEffect(() => {
    setReport(checkDatabaseFiles());
  });

  if (!__DEV__) {
    return null;
  }
  return (
    <Screen testID="screen-storage-check">
      <Card>
        <CardHeader>
          <CardTitle accessibilityRole="header">{t("dev.storageCheck.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {report === undefined ? (
            <Text testID="storage-check-result">…</Text>
          ) : (
            <>
              <Row
                testID="storage-check-database"
                label={t("dev.storageCheck.database")}
                value={t(formatKey(report.inventory.database))}
              />
              <Row
                testID="storage-check-copy"
                label={t("dev.storageCheck.copy")}
                value={t(formatKey(report.inventory.copy))}
              />
              <Row
                testID="storage-check-copy-check"
                label={t("dev.storageCheck.copyCheck")}
                value={t(copyCheckKey(report.copy))}
              />
              <KeptRow files={report.inventory.kept} />
            </>
          )}
        </CardContent>
      </Card>
    </Screen>
  );
}
