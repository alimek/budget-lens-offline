import { Host, HStack, Picker, Spacer, Text } from "@expo/ui/swift-ui";
import {
  accessibilityHidden,
  accessibilityIdentifier,
  foregroundStyle,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useThemeColors } from "../use-theme";
import type { PickerProps } from "./types";

/**
 * Label and a SwiftUI menu-style `Picker` (tint `primary`) in one row. The picker itself carries the label, so
 * VoiceOver reads "<label>, <selected option>, pop-up button" and activating it opens the menu; the visible label
 * text is hidden from accessibility.
 */
export function AppPicker<T extends string>({
  label,
  options,
  value,
  onValueChange,
  testID,
}: PickerProps<T>) {
  const theme = useThemeColors();
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <HStack spacing={8}>
        <Text modifiers={[foregroundStyle(theme.foreground), accessibilityHidden(true)]}>
          {label}
        </Text>
        <Spacer />
        <Picker<T>
          label={label}
          selection={value}
          onSelectionChange={onValueChange}
          testID={testID}
          modifiers={[pickerStyle("menu"), tint(theme.primary)]}
        >
          {options.map((option) => (
            <Text
              key={option.value}
              modifiers={[tag(option.value), accessibilityIdentifier(`${testID}-${option.value}`)]}
            >
              {option.label}
            </Text>
          ))}
        </Picker>
      </HStack>
    </Host>
  );
}
