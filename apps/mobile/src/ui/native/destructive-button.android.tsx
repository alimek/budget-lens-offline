import { OutlinedButton, Text } from "@expo/ui/jetpack-compose";
import { testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import { useThemeColors } from "../use-theme";
import { ButtonHost, fullWidthModifiers } from "./button.android";
import type { ButtonProps } from "./types";

/**
 * The action that can cost the user something, such as "Start over": Material 3 `OutlinedButton` with outline and
 * label in `destructive`, filled width (#60). Colour is never the only signal: the label says what it does, and
 * the screen asks again before doing it.
 */
export function DestructiveButton({ label, onPress, testID, disabled, fullWidth }: ButtonProps) {
  const theme = useThemeColors();
  return (
    <ButtonHost fullWidth={fullWidth}>
      <OutlinedButton
        onClick={onPress}
        enabled={!disabled}
        colors={{ contentColor: theme.destructive }}
        modifiers={[...fullWidthModifiers(fullWidth), testIDModifier(testID)]}
      >
        <Text>{label}</Text>
      </OutlinedButton>
    </ButtonHost>
  );
}
