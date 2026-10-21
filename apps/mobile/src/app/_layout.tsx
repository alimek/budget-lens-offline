import "../../global.css";
import { PortalHost } from "@rn-primitives/portal";
import { DarkTheme, DefaultTheme, Stack, type Theme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DatabaseGate } from "../db/database-gate";
import { I18nProvider } from "../i18n";
import { AppStoreProvider } from "../state/app-store";
import { NAV_THEME, resolveColorScheme } from "../ui/lib/theme";
import { checkForUpdateInBackground } from "../updates/update-check";

void SplashScreen.preventAutoHideAsync();

function useNavigationTheme(): Theme {
  const scheme = resolveColorScheme(useColorScheme());
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  return { ...base, colors: NAV_THEME[scheme] };
}

function RootStack() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="dev/design-system"
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: "minimal",
          title: t("dev.designSystem.title"),
        }}
      />
      <Stack.Screen
        name="dev/design-system-list"
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: "minimal",
          title: t("dev.designSystem.listTitle"),
        }}
      />
      <Stack.Screen
        name="dev/boot-screen"
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: "minimal",
          title: t("dev.bootScreen.title"),
        }}
      />
      <Stack.Screen
        name="dev/storage-check"
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: "minimal",
          title: t("dev.storageCheck.title"),
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const theme = useNavigationTheme();
  useEffect(() => {
    SplashScreen.hide();
    // EAS Update: background check after the first render; never blocks startup or reloads the session.
    void checkForUpdateInBackground(
      { enabled: Updates.isEnabled, development: __DEV__, channel: Updates.channel },
      { checkForUpdate: Updates.checkForUpdateAsync, fetchUpdate: Updates.fetchUpdateAsync },
    );
  }, []);
  return (
    // Gesture handler root: TransactionRow swipe actions on Android (react-native-gesture-handler + Reanimated).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <AppStoreProvider>
          <ThemeProvider value={theme}>
            <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
            <DatabaseGate>
              <RootStack />
            </DatabaseGate>
            {/* React Native Reusables portal target (its standard root setup, checked by \`doctor\`). The overlay
                wrappers are native and do not render into it. */}
            <PortalHost />
          </ThemeProvider>
        </AppStoreProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
