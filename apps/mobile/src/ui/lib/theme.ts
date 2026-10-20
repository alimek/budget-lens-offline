/**
 * Typed Indigo design tokens (#58, direction C) for native props that take colours, not class names:
 * `NativeTabs` tint, Expo UI button/toggle/progress tints, the navigation theme and the status bar.
 * The same values live in `global.css` for Uniwind classes; `theme.test.ts` keeps both in sync.
 */
export type ColorScheme = "light" | "dark";

export type ColorToken =
  | "background"
  | "foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "accent"
  | "accent-foreground"
  | "destructive"
  | "expense"
  | "income"
  | "border"
  | "input"
  | "ring";

export type ThemeColors = Readonly<Record<ColorToken, string>>;

export const colors: Readonly<Record<ColorScheme, ThemeColors>> = {
  light: {
    background: "#F2F2F7",
    foreground: "#1C1C1E",
    card: "#FFFFFF",
    "card-foreground": "#1C1C1E",
    popover: "#FFFFFF",
    "popover-foreground": "#1C1C1E",
    primary: "#3F4BA8",
    "primary-foreground": "#FFFFFF",
    secondary: "#E5E5EA",
    "secondary-foreground": "#1C1C1E",
    muted: "#E5E5EA",
    "muted-foreground": "#636369",
    accent: "#E8EAF6",
    "accent-foreground": "#1C1C1E",
    destructive: "#C0392B",
    expense: "#C0392B",
    income: "#2E7D4F",
    border: "#C6C6C8",
    input: "#C6C6C8",
    ring: "#3F4BA8",
  },
  dark: {
    background: "#000000",
    foreground: "#FFFFFF",
    card: "#1C1C1E",
    "card-foreground": "#FFFFFF",
    popover: "#1C1C1E",
    "popover-foreground": "#FFFFFF",
    primary: "#9AA3F5",
    "primary-foreground": "#10154A",
    secondary: "#2C2C2E",
    "secondary-foreground": "#FFFFFF",
    muted: "#2C2C2E",
    "muted-foreground": "#98989F",
    accent: "#23264A",
    "accent-foreground": "#FFFFFF",
    destructive: "#FF6B5E",
    expense: "#FF6B5E",
    income: "#4CC38A",
    border: "#38383A",
    input: "#38383A",
    ring: "#9AA3F5",
  },
};

/**
 * Corner radius tokens (`--radius-*` in `global.css`) in points, for custom elements only; native controls keep their
 * platform shapes.
 */
export const radii = { sm: 6, md: 8, lg: 12 } as const;

/** The colours React Navigation takes (`Theme["colors"]` in `expo-router`). */
export interface NavigationColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
}

/**
 * Navigation theme colours (stack headers, screen backgrounds) from the tokens. The root layout passes them to the
 * `ThemeProvider`; React Native Reusables expects this `NAV_THEME` in its theme file.
 */
export const NAV_THEME: Readonly<Record<ColorScheme, NavigationColors>> = {
  light: navigationColors(colors.light),
  dark: navigationColors(colors.dark),
};

function navigationColors(tokens: ThemeColors): NavigationColors {
  return {
    primary: tokens.primary,
    background: tokens.background,
    card: tokens.card,
    text: tokens.foreground,
    border: tokens.border,
    notification: tokens.destructive,
  };
}

/** Resolves React Native's colour scheme (`null` or `"unspecified"` when unknown) to a token set. */
export function resolveColorScheme(scheme: string | null | undefined): ColorScheme {
  return scheme === "dark" ? "dark" : "light";
}
