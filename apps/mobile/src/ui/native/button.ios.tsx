import { Button, Host } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  foregroundStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useThemeColors } from "../use-theme";
import type { ButtonProps } from "./types";

/** Filled primary action: SwiftUI `.borderedProminent`, tint `primary`, label `primary-foreground`. */
export function PrimaryButton({ label, onPress, testID, disabled = false }: ButtonProps) {
  const theme = useThemeColors();
  return (
    <Host matchContents>
      <Button
        label={label}
        onPress={onPress}
        testID={testID}
        modifiers={[
          buttonStyle("borderedProminent"),
          controlSize("large"),
          tint(theme.primary),
          foregroundStyle(theme["primary-foreground"]),
          disabledModifier(disabled),
        ]}
      />
    </Host>
  );
}

/** Secondary action: SwiftUI `.bordered`, tint `primary`. */
export function SecondaryButton({ label, onPress, testID, disabled = false }: ButtonProps) {
  const theme = useThemeColors();
  return (
    <Host matchContents>
      <Button
        label={label}
        onPress={onPress}
        testID={testID}
        modifiers={[
          buttonStyle("bordered"),
          controlSize("large"),
          tint(theme.primary),
          disabledModifier(disabled),
        ]}
      />
    </Host>
  );
}
