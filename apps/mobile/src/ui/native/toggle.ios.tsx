import { Host, Toggle } from "@expo/ui/swift-ui";
import { disabled as disabledModifier, tint } from "@expo/ui/swift-ui/modifiers";
import { useThemeColors } from "../use-theme";
import type { ToggleProps } from "./types";

/**
 * SwiftUI `Toggle(label:)`: VoiceOver reads the label and the on/off state as one switch, and the label is part of
 * the touch target. On colour `primary`.
 */
export function AppToggle({ label, value, onValueChange, testID, disabled = false }: ToggleProps) {
  const theme = useThemeColors();
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <Toggle
        label={label}
        isOn={value}
        onIsOnChange={onValueChange}
        testID={testID}
        modifiers={[tint(theme.primary), disabledModifier(disabled)]}
      />
    </Host>
  );
}
