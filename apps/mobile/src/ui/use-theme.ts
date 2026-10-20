import { type ColorValue, DynamicColorIOS, Platform, useColorScheme } from "react-native";
import { type ColorToken, colors, resolveColorScheme, type ThemeColors } from "./theme";

/** Token colours for the current system appearance, for native props that take colours. */
export function useThemeColors(): ThemeColors {
  return colors[resolveColorScheme(useColorScheme())];
}

/**
 * A colour that follows the system appearance by itself: `DynamicColorIOS` on iOS, the current scheme's value
 * elsewhere (re-rendered by `useColorScheme`).
 */
export function useDynamicColor(token: ColorToken): ColorValue {
  const current = useThemeColors()[token];
  if (Platform.OS !== "ios") return current;
  return DynamicColorIOS({ light: colors.light[token], dark: colors.dark[token] });
}
