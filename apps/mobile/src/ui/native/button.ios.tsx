import { Button, type ButtonRole, Host, Text as NativeText } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  foregroundStyle,
  frame,
  type ModifierConfig,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import type { ReactElement } from "react";
import { useThemeColors } from "../use-theme";
import type { ButtonProps } from "./types";

/** The host of a button: sized to its content, or stretched across the screen when `fullWidth` asks for it. */
function ButtonHost({
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

/**
 * A button of one style, so the three actions share the stretching of #60. SwiftUI draws the `.bordered`
 * background around the label, so a frame on the button itself would only move it: a full-width button therefore
 * hands the button a label of its own that fills the host and centres its text, and the background follows it.
 */
export function StyledButton({
  label,
  onPress,
  testID,
  modifiers,
  role,
  fullWidth,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
  readonly modifiers: readonly ModifierConfig[];
  readonly role?: ButtonRole;
  readonly fullWidth: boolean | undefined;
}) {
  // The label is either the string or the filling view above, never both: SwiftUI would nest them.
  const content =
    fullWidth === true
      ? {
          children: (
            <NativeText
              modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY, alignment: "center" })]}
            >
              {label}
            </NativeText>
          ),
        }
      : { label };
  return (
    <ButtonHost fullWidth={fullWidth}>
      <Button
        {...content}
        {...(role === undefined ? {} : { role })}
        onPress={onPress}
        testID={testID}
        modifiers={[...modifiers]}
      />
    </ButtonHost>
  );
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
    <StyledButton
      label={label}
      onPress={onPress}
      testID={testID}
      fullWidth={fullWidth}
      modifiers={[
        buttonStyle("borderedProminent"),
        controlSize("large"),
        tint(theme.primary),
        foregroundStyle(theme["primary-foreground"]),
        disabledModifier(disabled),
      ]}
    />
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
    <StyledButton
      label={label}
      onPress={onPress}
      testID={testID}
      fullWidth={fullWidth}
      modifiers={[
        buttonStyle("bordered"),
        controlSize("large"),
        tint(theme.primary),
        disabledModifier(disabled),
      ]}
    />
  );
}
