import { Host, Picker, Text } from "@expo/ui/swift-ui";
import { accessibilityIdentifier, pickerStyle, tag, tint } from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";
import { Text as AppText } from "../components/text";
import { useThemeColors } from "../use-theme";
import type { PickerProps } from "./types";

/**
 * A SwiftUI menu-style `Picker` (tint `primary`) under its label, like the text fields. The picker itself carries
 * the label, so VoiceOver reads "<label>, <selected option>, pop-up button" and activating it opens the menu; the
 * visible label is hidden from accessibility. Stacking (not a label/value row) keeps both readable at the largest
 * text sizes.
 */
export function AppPicker<T extends string>({
  label,
  options,
  value,
  onValueChange,
  testID,
  hideLabel = false,
}: PickerProps<T>) {
  const theme = useThemeColors();
  return (
    <View className="items-start gap-1 self-stretch">
      {hideLabel ? null : (
        <AppText variant="footnote" className="text-muted-foreground" accessibilityElementsHidden>
          {label}
        </AppText>
      )}
      <Host matchContents>
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
      </Host>
    </View>
  );
}
