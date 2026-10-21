import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { forgetDatabaseKey } from "@/db/db-key";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";

type Outcome = "waiting" | "forgotten" | "absent" | "failed";

/**
 * Development-only trigger for the recovery screen (#75 R6): it forgets the stored database key, leaving a real
 * encrypted database that this device can no longer open. The next cold start then runs the open sequence over
 * that file, which is the acceptance criterion of #75 rather than a rendered mock of it.
 *
 * Terminating and reopening the app is part of the test; in a release build the route redirects away, so no
 * release build can reach this.
 */
export default function DevForgetKey() {
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState<Outcome>("waiting");
  useEffect(() => {
    void forgetDatabaseKey().then(
      (forgotten) => setOutcome(forgotten ? "forgotten" : "absent"),
      () => setOutcome("failed"),
    );
  }, []);

  if (!__DEV__) {
    return <Redirect href="/(tabs)/overview" />;
  }
  return (
    <Screen testID="screen-forget-key">
      <Card>
        <CardHeader>
          <CardTitle accessibilityRole="header">{t("dev.forgetKey.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text testID="forget-key-result">{t(`dev.forgetKey.${outcome}`)}</Text>
        </CardContent>
      </Card>
    </Screen>
  );
}
