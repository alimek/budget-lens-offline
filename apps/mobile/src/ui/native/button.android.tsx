// Platform split: Metro loads button.ios.tsx / button.android.tsx; this file gives TypeScript the shared API.
import { Button, Host, OutlinedButton, Text } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import type { ReactElement } from "react";
import { useThemeColors } from "../use-theme";
import type { ButtonProps } from "./types";

/** The host of a button: sized to its content, or stretched across the screen when `fullWidth` asks for it. */
export function ButtonHost({
  fullWidth,
  children,
}: {
  readonly fullWidth: boolean | undefined;
  readonly children: ReactElement;
}) {
  if (fullWidth !== true) {
    return <Host matchContents>{children}</Host>;
  }
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      {children}
    </Host>
  );
}

/** The modifier every full-width button needs so Compose fills the stretched host (#60). M3 buttons keep their
own 48 dp minimum height, and a long label wraps instead of truncating. */
export function fullWidthModifiers(fullWidth: boolean | undefined) {
  return fullWidth === true ? [fillMaxWidth()] : [];
}

/** Filled primary action: Material 3 `Button`, container `primary`, content `primary-foreground`. */
export function PrimaryButton({ label, onPress, testID, disabled, fullWidth }: ButtonProps) {
  const theme = useThemeColors();
  return (
    <ButtonHost fullWidth={fullWidth}>
      <Button
        onClick={onPress}
        enabled={!disabled}
        colors={{ containerColor: theme.primary, contentColor: theme["primary-foreground"] }}
        modifiers={[...fullWidthModifiers(fullWidth), testIDModifier(testID)]}
      >
        <Text>{label}</Text>
      </Button>
    </ButtonHost>
  );
}

/** Secondary action: Material 3 `OutlinedButton`, content `primary`. */
export function SecondaryButton({ label, onPress, testID, disabled, fullWidth }: ButtonProps) {
  const theme = useThemeColors();
  return (
    <ButtonHost fullWidth={fullWidth}>
      <OutlinedButton
        onClick={onPress}
        enabled={!disabled}
        colors={{ contentColor: theme.primary }}
        modifiers={[...fullWidthModifiers(fullWidth), testIDModifier(testID)]}
      >
        <Text>{label}</Text>
      </OutlinedButton>
    </ButtonHost>
  );
}
