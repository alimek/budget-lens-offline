import { Button, Host } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  foregroundStyle,
  frame,
  tint,
} from "@expo/ui/swift-ui/modifiers";
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

/** The modifier every full-width button needs so SwiftUI fills the stretched host (#60). */
export function fullWidthFrame(fullWidth: boolean | undefined) {
  return fullWidth === true ? [frame({ maxWidth: Number.POSITIVE_INFINITY })] : [];
}

/** Filled primary action: SwiftUI `.borderedProminent`, tint `primary`, label `primary-foreground`. */
export function PrimaryButton({
  label,
  onPress,
  testID,
  disabled = false,
  fullWidth,
}: ButtonProps) {
  const theme = useThemeColors();
  return (
    <ButtonHost fullWidth={fullWidth}>
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
          ...fullWidthFrame(fullWidth),
        ]}
      />
    </ButtonHost>
  );
}

/** Secondary action: SwiftUI `.bordered`, tint `primary`. */
export function SecondaryButton({
  label,
  onPress,
  testID,
  disabled = false,
  fullWidth,
}: ButtonProps) {
  const theme = useThemeColors();
  return (
    <ButtonHost fullWidth={fullWidth}>
      <Button
        label={label}
        onPress={onPress}
        testID={testID}
        modifiers={[
          buttonStyle("bordered"),
          controlSize("large"),
          tint(theme.primary),
          disabledModifier(disabled),
          ...fullWidthFrame(fullWidth),
        ]}
      />
    </ButtonHost>
  );
}
