import "../../global.css";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar, useColorScheme } from "react-native";
import { I18nProvider } from "../i18n";
import { AppStoreProvider } from "../state/app-store";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <I18nProvider>
      <AppStoreProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </AppStoreProvider>
    </I18nProvider>
  );
}
