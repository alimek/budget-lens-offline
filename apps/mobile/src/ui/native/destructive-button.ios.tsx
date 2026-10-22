import {
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useThemeColors } from "../use-theme";
import { StyledButton } from "./button.ios";
import type { ButtonProps } from "./types";

/**
 * The action that can cost the user something, such as "Start over": SwiftUI `Button(role: .destructive)` with
 * `.borderless`, large and full width (#60).
 *
 * Borderless on purpose: a red label on the red-tinted `.bordered` fill is 3.91:1 in light mode and fails AA,
 * while a plain `destructive` label on `background` reaches 4.87:1 in light and 7.52:1 in dark. Colour is never
 * the only signal either — the label says what it does, and the screen asks again before doing it.
 */
export function DestructiveButton({
  label,
  onPress,
  testID,
  disabled = false,
  fullWidth,
}: ButtonProps) {
  const theme = useThemeColors();
  return (
    // biome-ignore lint/a11y/useValidAriaRole: StyledButton takes the SwiftUI button role, not an ARIA role
    <StyledButton
      label={label}
      onPress={onPress}
      testID={testID}
      fullWidth={fullWidth}
      // `role` is the SwiftUI button role, which draws and announces the action as destructive.
      role="destructive"
      modifiers={[
        buttonStyle("borderless"),
        controlSize("large"),
        tint(theme.destructive),
        disabledModifier(disabled),
      ]}
    />
  );
}
