import {
  Host,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import { useThemeColors } from "../use-theme";
import type { SegmentedControlProps } from "./types";

/** Material 3 single-choice `SegmentedButton` row; selected container `primary`. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  testID,
}: SegmentedControlProps<T>) {
  const theme = useThemeColors();
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth(), testIDModifier(testID)]}>
        {options.map((option) => (
          <SegmentedButton
            key={option.value}
            selected={option.value === value}
            onClick={() => onValueChange(option.value)}
            colors={{
              activeContainerColor: theme.primary,
              activeContentColor: theme["primary-foreground"],
              activeBorderColor: theme.primary,
              inactiveContainerColor: theme.card,
              inactiveContentColor: theme.foreground,
              inactiveBorderColor: theme.border,
            }}
            modifiers={[testIDModifier(`${testID}-${option.value}`)]}
          >
            <SegmentedButton.Label>
              <Text>{option.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Host>
  );
}
