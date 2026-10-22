import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DatabaseFileInventory } from "@/db/database-files";
import { checkDatabaseFiles } from "@/db/storage-check";
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
 * aside. The copy is taken for real, through the same steps a migration takes, so the screen reports what this
 * build actually writes. Open it with
 * `budget-lens:///dev/storage-check`; a release build cannot reach the route and the effect runs only under
 * `useDevEffect` (#75 R7).
 */
export default function DevStorageCheck() {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<DatabaseFileInventory>();
  useDevEffect(() => {
    setInventory(checkDatabaseFiles());
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
          {inventory === undefined ? (
            <Text testID="storage-check-result">…</Text>
          ) : (
            <>
              <Row
                testID="storage-check-database"
                label={t("dev.storageCheck.database")}
                value={t(formatKey(inventory.database))}
              />
              <Row
                testID="storage-check-copy"
                label={t("dev.storageCheck.copy")}
                value={t(formatKey(inventory.copy))}
              />
              <KeptRow files={inventory.kept} />
            </>
          )}
        </CardContent>
      </Card>
    </Screen>
  );
}
