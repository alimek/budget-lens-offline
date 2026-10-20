import { Host, SecureField, TextField, useNativeState } from "@expo/ui/swift-ui";
import {
  accessibilityHint,
  accessibilityLabel,
  keyboardType,
  textFieldStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";
import { Text } from "../components/text";
import { useThemeColors } from "../use-theme";
import type { TextFieldProps } from "./types";
import { useSyncedText } from "./use-synced-text";

const FIELDS = {
  text: { Field: TextField, keyboard: "default" },
  decimal: { Field: TextField, keyboard: "decimal-pad" },
  secure: { Field: SecureField, keyboard: "default" },
} as const;

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
  const handleChange = useSyncedText(text, value, onChangeText);
  const modifiers = [
    textFieldStyle("roundedBorder"),
    tint(theme.primary),
    accessibilityLabel(label),
    // Always present (empty without an error): changing the modifier list mid-typing resets the field's focus.
    accessibilityHint(error ?? ""),
    keyboardType(FIELDS[kind].keyboard),
  ];
  const { Field } = FIELDS[kind];
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
      <FieldError error={error} testID={`${testID}-error`} />
    </View>
  );
}

function FieldError({ error, testID }: { error: string | undefined; testID: string }) {
  if (!error) return null;
  return (
    <Text variant="footnote" className="text-expense" testID={testID}>
      {error}
    </Text>
  );
}
