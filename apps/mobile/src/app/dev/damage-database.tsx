import { Redirect } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { damageDatabaseFile } from "@/db/database-files";
import { useDevEffect } from "@/dev/use-dev-effect";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";

type Outcome = "waiting" | "damaged" | "absent" | "failed";

/**
 * Development-only trigger for the recovery screen (#242, #75 R6): it leaves a real database file on the device
 * that this app cannot open, with the database that was there renamed and kept as "start over" keeps it. The next
 * cold start then runs the open sequence over that file, which is the acceptance criterion of #242 rather than a
 * rendered mock of it.
 *
 * Terminating and reopening the app is part of the test. A release build cannot reach this route: the screens
 * under `src/app/dev` are registered behind `Stack.Protected guard={__DEV__}`, the effect runs only under
 * `useDevEffect`, and `damageDatabaseFile` itself refuses outside `__DEV__`.
 */
export default function DevDamageDatabase() {
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState<Outcome>("waiting");
  // Never in a release build: this overwrites the database file on the device (#75 R7).
  useDevEffect(() => {
    try {
      setOutcome(damageDatabaseFile(Date.now()) ? "damaged" : "absent");
    } catch {
      setOutcome("failed");
    }
  });

  if (!__DEV__) {
    return <Redirect href="/(tabs)/overview" />;
  }
  return (
    <Screen testID="screen-damage-database">
      <Card>
        <CardHeader>
          <CardTitle accessibilityRole="header">{t("dev.damageDatabase.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text testID="damage-database-result">{t(`dev.damageDatabase.${outcome}`)}</Text>
        </CardContent>
      </Card>
    </Screen>
  );
}
