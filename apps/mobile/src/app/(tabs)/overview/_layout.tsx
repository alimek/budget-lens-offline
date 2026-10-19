import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export const unstable_settings = { anchor: "index" };

export default function Layout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("nav.tabs.overview") }} />
      <Stack.Screen name="savings" options={{ title: t("nav.savings") }} />
    </Stack>
  );
}
