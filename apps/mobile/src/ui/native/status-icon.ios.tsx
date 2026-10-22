import { Host, Image } from "@expo/ui/swift-ui";
import { useThemeColors } from "../use-theme";
import type { StatusIconName, StatusIconProps } from "./types";

/** The SF Symbol of each situation (#60 dev-spec deltas). */
const SYMBOLS = {
  key: "key.slash",
  lock: "lock.slash",
  shield: "lock.shield",
  warning: "exclamationmark.triangle",
  error: "exclamationmark.circle",
} as const satisfies Record<StatusIconName, string>;

/** The 48 pt glyph above a boot screen, tinted `primary`. It is decorative: the title says what it means. */
export function StatusIcon({ name, size = 48 }: StatusIconProps) {
  const theme = useThemeColors();
  return (
    <Host matchContents>
      <Image systemName={SYMBOLS[name]} size={size} color={theme.primary} />
    </Host>
  );
}
