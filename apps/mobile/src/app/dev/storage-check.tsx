import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FileEncryption } from "@/db/database-files";
import {
  checkEncryptedStorage,
  type EncryptedStorageCheck,
  type StorageCheckOutcome,
} from "@/db/encrypted-database";
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
  readonly value: string | number;
}) {
  return <Text testID={testID}>{`${label}: ${String(value)}`}</Text>;
}

function stateKey(state: FileEncryption) {
  return state === "encrypted"
    ? "dev.storageCheck.encrypted"
    : state === "plaintext"
      ? "dev.storageCheck.plaintext"
      : "dev.storageCheck.missing";
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
  return <Row testID={testID} label={label} value={t(stateKey(state))} />;
}

/** The files kept besides the live one, each with its encryption state (#75 R6). */
function KeptRow({ files }: { readonly files: EncryptedStorageCheck["kept"] }) {
  const { t } = useTranslation();
  const value =
    files.map((file) => `${file.name} ${t(stateKey(file.state))}`).join(", ") ||
    t("dev.storageCheck.missing");
  return <Row testID="storage-check-kept" label={t("dev.storageCheck.kept")} value={value} />;
}

function CheckOutcome({ outcome }: { readonly outcome: StorageCheckOutcome }) {
  const { t } = useTranslation();
  if (outcome.kind !== "ready") {
    return <Text testID="storage-check-result">{outcome.kind}</Text>;
  }
  const { cipherVersion, cipherStatus, database, copy, kept } = outcome.check;
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
      <KeptRow files={kept} />
    </>
  );
}

/**
 * Development-only check (#75) that this build really encrypts: it reads `PRAGMA cipher_version`, looks at the
 * first bytes of the database file, takes a real pre-migration copy when none is being kept, and lists the files
 * the app is keeping besides the live one. Open it with `budget-lens:///dev/storage-check`; a release build
 * cannot reach the route and the effect runs only under `useDevEffect` (#75 R7).
 */
export default function DevStorageCheck() {
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState<StorageCheckOutcome>();
  // Opens a second keyed connection and takes a copy: development only (#75 R7).
  useDevEffect(() => {
    void checkEncryptedStorage().then(setOutcome, (error: unknown) =>
      setOutcome({ kind: "storage_unreachable", error }),
    );
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
