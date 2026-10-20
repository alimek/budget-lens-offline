import "../../global.css";
import { DarkTheme, DefaultTheme, Stack, type Theme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, useColorScheme } from "react-native";
import { I18nProvider } from "../i18n";
import { AppStoreProvider } from "../state/app-store";
import { colors, resolveColorScheme } from "../ui/theme";

void SplashScreen.preventAutoHideAsync();

function useNavigationTheme(): Theme {
  const scheme = resolveColorScheme(useColorScheme());
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const tokens = colors[scheme];
  return {
    ...base,
    colors: {
      primary: tokens.primary,
      background: tokens.background,
      card: tokens.card,
      text: tokens.foreground,
      border: tokens.border,
      notification: tokens.destructive,
    },
  };
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
    </Stack>
  );
}

export default function RootLayout() {
  const theme = useNavigationTheme();
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <I18nProvider>
      <AppStoreProvider>
        <ThemeProvider value={theme}>
          <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
          <RootStack />
        </ThemeProvider>
      </AppStoreProvider>
    </I18nProvider>
  );
}
