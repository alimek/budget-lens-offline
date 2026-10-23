import {
  Host,
  Icon,
  IconButton,
  OutlinedTextField,
  Row,
  Text,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  semantics,
  size,
  testID as testIDModifier,
  width,
} from "@expo/ui/jetpack-compose/modifiers";
import { useEffect } from "react";
import type { ImageSourcePropType } from "react-native";
import increaseIcon from "../../../assets/icons/add.xml";
import decreaseIcon from "../../../assets/icons/remove.xml";
import { useThemeColors } from "../use-theme";
import type { StepperProps } from "./types";

/** Width of the value field, wide enough for the three digits of the largest interval (#63). */
const FIELD_WIDTH = 96;

/** One of the two step buttons, 48 dp on a side as #63's accessibility note asks. */
function StepButton({
  icon,
  name,
  testID,
  disabled,
  onPress,
}: {
  readonly icon: ImageSourcePropType;
  readonly name: string;
  readonly testID: string;
  readonly disabled: boolean;
  readonly onPress: () => void;
}) {
  const theme = useThemeColors();
  // Rendered inside the one `Host` of the stepper: a Compose view has to be a direct child of a host, and the row
  // of the stepper is that host's child, not a host of its own.
  return (
    <IconButton
      enabled={!disabled}
      onClick={onPress}
      colors={{
        contentColor: theme.foreground,
        disabledContentColor: theme["muted-foreground"],
      }}
      modifiers={[size(48, 48), semantics({ contentDescription: name }), testIDModifier(testID)]}
    >
      <Icon
        source={icon}
        tint={disabled ? theme["muted-foreground"] : theme.foreground}
        size={24}
      />
    </IconButton>
  );
}

/**
 * Compose has no stepper, so #63 specifies the value as an outlined field between two `IconButton`s, each 48 dp.
 * The field is read-only: the number only ever moves one step at a time, and the buttons already reach every
 * value in `min` … `max`, so a typed value would be a third path to an interval the caller has not accepted.
 * The buttons stop at the bounds, which is what keeps the value inside them.
 */
export function AppStepper({
  label,
  value,
  min,
  max,
  onValueChange,
  decreaseLabel,
  increaseLabel,
  testID,
}: StepperProps) {
  const theme = useThemeColors();
  const text = useNativeState(String(value));
  // The buttons change the value behind the field's back, so the shown text follows the prop.
  useEffect(() => {
    text.set(String(value));
  }, [text, value]);
  return (
    <Host matchContents>
      <Row verticalAlignment="center">
        <StepButton
          icon={decreaseIcon}
          name={decreaseLabel}
          testID={`${testID}-decrease`}
          disabled={value <= min}
          onPress={() => onValueChange(Math.max(min, value - 1))}
        />
        <OutlinedTextField
          value={text}
          readOnly
          singleLine
          textStyle={{ textAlign: "center" }}
          colors={{
            focusedTextColor: theme.foreground,
            unfocusedTextColor: theme.foreground,
            focusedIndicatorColor: theme.primary,
            unfocusedIndicatorColor: theme["muted-foreground"],
            focusedLabelColor: theme.primary,
            unfocusedLabelColor: theme["muted-foreground"],
          }}
          modifiers={[width(FIELD_WIDTH), testIDModifier(testID)]}
        >
          <OutlinedTextField.Label>
            <Text>{label}</Text>
          </OutlinedTextField.Label>
        </OutlinedTextField>
        <StepButton
          icon={increaseIcon}
          name={increaseLabel}
          testID={`${testID}-increase`}
          disabled={value >= max}
          onPress={() => onValueChange(Math.min(max, value + 1))}
        />
      </Row>
    </Host>
  );
}
