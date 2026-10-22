import { Button } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useThemeColors } from "../use-theme";
import { ButtonHost, fullWidthFrame } from "./button.ios";
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
    <ButtonHost fullWidth={fullWidth}>
      {/* `role` is the SwiftUI button role, which draws and announces the action as destructive. */}
      {/* biome-ignore lint/a11y/useValidAriaRole: the Expo UI Button takes it, the DOM does not */}
      <Button
        role="destructive"
        label={label}
        onPress={onPress}
        testID={testID}
        modifiers={[
          buttonStyle("borderless"),
          controlSize("large"),
          tint(theme.destructive),
          disabledModifier(disabled),
          ...fullWidthFrame(fullWidth),
        ]}
      />
    </ButtonHost>
  );
}
