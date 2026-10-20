import { Host, SecureField, TextField, useNativeState } from "@expo/ui/swift-ui";
import {
  accessibilityHint,
  accessibilityLabel,
  keyboardType,
  textFieldStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Text } from "../components/text";
import { useThemeColors } from "../use-theme";
import type { TextFieldProps } from "./types";

/**
 * SwiftUI `TextField` (`SecureField` for `kind="secure"`) with the rounded border style and cursor `primary`. The
 * label sits above the field and is also its accessibility label; an error is shown below in `expense` and read as
 * the field's hint.
 */
export function AppTextField({
  label,
  value,
  onChangeText,
  testID,
  placeholder,
  kind = "text",
  error,
}: TextFieldProps) {
  const theme = useThemeColors();
  const text = useNativeState(value);
  // The native field owns the text while typing; push the prop only when it differs from what the field last
  // reported, so a re-render that lags behind fast input never overwrites newer keystrokes.
  const reported = useRef(value);
  useEffect(() => {
    if (value !== reported.current) {
      reported.current = value;
      text.set(value);
    }
  }, [text, value]);
  const handleChange = (next: string) => {
    reported.current = next;
    onChangeText(next);
  };
  const modifiers = [
    textFieldStyle("roundedBorder"),
    tint(theme.primary),
    accessibilityLabel(label),
    ...(error ? [accessibilityHint(error)] : []),
    ...(kind === "decimal" ? [keyboardType("decimal-pad")] : []),
  ];
  const Field = kind === "secure" ? SecureField : TextField;
  return (
    <View className="gap-1 self-stretch">
      <Text variant="footnote" className="text-muted-foreground" accessibilityElementsHidden>
        {label}
      </Text>
      <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
        <Field
          text={text}
          {...(placeholder === undefined ? {} : { placeholder })}
          onTextChange={handleChange}
          testID={testID}
          modifiers={modifiers}
        />
      </Host>
      {error ? (
        <Text variant="footnote" className="text-expense" testID={`${testID}-error`}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
