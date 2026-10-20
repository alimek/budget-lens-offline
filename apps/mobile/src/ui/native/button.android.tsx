import { Button, Host, OutlinedButton, Text } from "@expo/ui/jetpack-compose";
import { testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import { useThemeColors } from "../use-theme";
import type { ButtonProps } from "./types";

/** Filled primary action: Material 3 `Button`, container `primary`, content `primary-foreground`. */
export function PrimaryButton({ label, onPress, testID, disabled = false }: ButtonProps) {
  const theme = useThemeColors();
  return (
    <Host matchContents>
      <Button
        onClick={onPress}
        enabled={!disabled}
        colors={{ containerColor: theme.primary, contentColor: theme["primary-foreground"] }}
        modifiers={[testIDModifier(testID)]}
      >
        <Text>{label}</Text>
      </Button>
    </Host>
  );
}

/** Secondary action: Material 3 `OutlinedButton`, content `primary`. */
export function SecondaryButton({ label, onPress, testID, disabled = false }: ButtonProps) {
  const theme = useThemeColors();
  return (
    <Host matchContents>
      <OutlinedButton
        onClick={onPress}
        enabled={!disabled}
        colors={{ contentColor: theme.primary }}
        modifiers={[testIDModifier(testID)]}
      >
        <Text>{label}</Text>
      </OutlinedButton>
    </Host>
  );
}
