import { Host, Icon } from "@expo/ui/jetpack-compose";
import errorIcon from "../../../assets/icons/error.xml";
import gppBadIcon from "../../../assets/icons/gpp_bad.xml";
import keyOffIcon from "../../../assets/icons/key_off.xml";
import noEncryptionIcon from "../../../assets/icons/no_encryption.xml";
import { useThemeColors } from "../use-theme";
import type { StatusIconName, StatusIconProps } from "./types";

/** The Material Symbol of each situation (#60 dev-spec deltas). */
const DRAWABLES = {
  key: keyOffIcon,
  lock: noEncryptionIcon,
  shield: gppBadIcon,
  warning: errorIcon,
  error: errorIcon,
} as const satisfies Record<StatusIconName, unknown>;

/** The 48 dp glyph above a boot screen, tinted `primary`. It is decorative: the title says what it means. */
export function StatusIcon({ name, size = 48 }: StatusIconProps) {
  const theme = useThemeColors();
  return (
    <Host matchContents>
      <Icon source={DRAWABLES[name]} tint={theme.primary} size={size} />
    </Host>
  );
}
