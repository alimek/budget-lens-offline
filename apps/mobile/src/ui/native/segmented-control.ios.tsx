import { Host, Picker, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag, tint } from "@expo/ui/swift-ui/modifiers";
import { useThemeColors } from "../use-theme";
import type { SegmentedControlProps } from "./types";

/** SwiftUI `Picker` with the segmented style; tint `primary`. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  testID,
}: SegmentedControlProps<T>) {
  const theme = useThemeColors();
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <Picker<T>
        selection={value}
        onSelectionChange={onValueChange}
        testID={testID}
        modifiers={[pickerStyle("segmented"), tint(theme.primary)]}
      >
        {options.map((option) => (
          <Text key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}
