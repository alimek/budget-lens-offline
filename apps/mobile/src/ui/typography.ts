/**
 * The #58 type scale. Each variant maps to an iOS Dynamic Type style and a Material 3 type role, with the
 * platform default size at the standard text size. Only size, line height and weight are set, never a font
 * family, so text renders in SF Pro / Roboto and scales with the user's text size.
 */
export type TypeVariant =
  | "display"
  | "title-1"
  | "title-2"
  | "title-3"
  | "headline"
  | "body"
  | "callout"
  | "subheadline"
  | "footnote"
  | "caption"
  | "section-label"
  | "amount-lg"
  | "amount";

type FontWeight = "400" | "500" | "600" | "700";

type TypeSpec = readonly [fontSize: number, lineHeight: number, fontWeight: FontWeight];

const ios: Readonly<Record<TypeVariant, TypeSpec>> = {
  display: [34, 41, "700"],
  "title-1": [28, 34, "700"],
  "title-2": [22, 28, "600"],
  "title-3": [20, 25, "600"],
  headline: [17, 22, "600"],
  body: [17, 22, "400"],
  callout: [16, 21, "400"],
  subheadline: [15, 20, "400"],
  footnote: [13, 18, "400"],
  caption: [12, 16, "400"],
  "section-label": [13, 18, "400"],
  "amount-lg": [28, 34, "700"],
  amount: [17, 22, "600"],
};

const android: Readonly<Record<TypeVariant, TypeSpec>> = {
  display: [32, 40, "400"],
  "title-1": [28, 36, "400"],
  "title-2": [22, 28, "400"],
  "title-3": [16, 24, "500"],
  headline: [16, 24, "500"],
  body: [16, 24, "400"],
  callout: [16, 24, "400"],
  subheadline: [14, 20, "400"],
  footnote: [12, 16, "400"],
  caption: [12, 16, "500"],
  "section-label": [14, 20, "500"],
  "amount-lg": [28, 36, "500"],
  amount: [16, 24, "500"],
};

const tabular = new Set<TypeVariant>(["amount", "amount-lg"]);

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: FontWeight;
  fontVariant?: "tabular-nums"[];
  textTransform?: "uppercase";
}

/** Text style for a variant on `platform` (`Platform.OS`); every platform other than iOS uses the M3 scale. */
export function typeStyle(variant: TypeVariant, platform: string): TypeStyle {
  const [fontSize, lineHeight, fontWeight] = (platform === "ios" ? ios : android)[variant];
  const style: TypeStyle = { fontSize, lineHeight, fontWeight };
  if (tabular.has(variant)) style.fontVariant = ["tabular-nums"];
  // iOS grouped-list section headers are uppercase footnotes; the M3 titleSmall role keeps its case.
  if (variant === "section-label" && platform === "ios") style.textTransform = "uppercase";
  return style;
}
