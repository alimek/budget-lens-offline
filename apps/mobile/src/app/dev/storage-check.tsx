import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FileEncryption } from "@/db/database-files";
import { checkEncryptedStorage, type StorageCheckOutcome } from "@/db/encrypted-database";
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
  readonly value: string | number;
}) {
  return <Text testID={testID}>{`${label}: ${String(value)}`}</Text>;
}

function FileRow({
  testID,
  label,
  state,
}: {
  readonly testID: string;
  readonly label: string;
  readonly state: FileEncryption;
}) {
  const { t } = useTranslation();
  const key =
    state === "encrypted"
      ? "dev.storageCheck.encrypted"
      : state === "plaintext"
        ? "dev.storageCheck.plaintext"
        : "dev.storageCheck.missing";
  return <Row testID={testID} label={label} value={t(key)} />;
}

function CheckOutcome({ outcome }: { readonly outcome: StorageCheckOutcome }) {
  const { t } = useTranslation();
  if (outcome.kind !== "ready") {
    return <Text testID="storage-check-result">{outcome.kind}</Text>;
  }
  const { cipherVersion, cipherStatus, database, copy } = outcome.check;
  const none = t("dev.storageCheck.missing");
  return (
    <>
      <Row
        testID="storage-check-cipher-version"
        label={t("dev.storageCheck.cipherVersion")}
        value={cipherVersion ?? none}
      />
      <Row
        testID="storage-check-cipher-status"
        label={t("dev.storageCheck.cipherStatus")}
        value={cipherStatus ?? none}
      />
      <FileRow
        testID="storage-check-database"
        label={t("dev.storageCheck.database")}
        state={database}
      />
      <FileRow testID="storage-check-copy" label={t("dev.storageCheck.copy")} state={copy} />
    </>
  );
}

/**
 * Development-only check (#75) that this build really encrypts: it reads `PRAGMA cipher_version`, looks at the
 * first bytes of the database file, and takes and discards a real pre-migration copy. Open it with
 * `budget-lens:///dev/storage-check`; the route renders nothing in a release build.
 */
export default function DevStorageCheck() {
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState<StorageCheckOutcome>();
  useEffect(() => {
    void checkEncryptedStorage().then(setOutcome, (error: unknown) =>
      setOutcome({ kind: "storage_unreachable", error }),
    );
  }, []);

  if (!__DEV__) {
    return null;
  }
  return (
    <Screen testID="screen-storage-check">
      <Card>
        <CardHeader>
          <CardTitle>{t("dev.storageCheck.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {outcome === undefined ? (
            <Text testID="storage-check-result">…</Text>
          ) : (
            <CheckOutcome outcome={outcome} />
          )}
        </CardContent>
      </Card>
    </Screen>
  );
}
