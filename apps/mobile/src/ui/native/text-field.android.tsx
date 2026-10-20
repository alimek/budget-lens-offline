import { Host, OutlinedTextField, Text, useNativeState } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import { useThemeColors } from "../use-theme";
import type { TextFieldProps } from "./types";
import { useSyncedText } from "./use-synced-text";

const KEYBOARD = { text: "text", decimal: "decimal", secure: "password" } as const;

/**
 * Material 3 outlined `TextField`: the floating label is the accessible name, focus and cursor `primary`, an error
 * turns the field `expense` and shows as supporting text, which TalkBack reads with the field.
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
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <OutlinedTextField
        value={text}
        onValueChange={handleChange}
        singleLine
        isError={Boolean(error)}
        visualTransformation={kind === "secure" ? "password" : "none"}
        keyboardOptions={{ keyboardType: KEYBOARD[kind], autoCorrectEnabled: kind === "text" }}
        colors={{
          focusedTextColor: theme.foreground,
          unfocusedTextColor: theme.foreground,
          cursorColor: theme.primary,
          focusedIndicatorColor: theme.primary,
          unfocusedIndicatorColor: theme["muted-foreground"],
          focusedLabelColor: theme.primary,
          unfocusedLabelColor: theme["muted-foreground"],
          errorIndicatorColor: theme.expense,
          errorLabelColor: theme.expense,
          errorSupportingTextColor: theme.expense,
          errorCursorColor: theme.expense,
        }}
        modifiers={[fillMaxWidth(), testIDModifier(testID)]}
      >
        <OutlinedTextField.Label>
          <Text>{label}</Text>
        </OutlinedTextField.Label>
        {placeholder ? (
          <OutlinedTextField.Placeholder>
            <Text>{placeholder}</Text>
          </OutlinedTextField.Placeholder>
        ) : null}
        {error ? (
          <OutlinedTextField.SupportingText>
            <Text modifiers={[testIDModifier(`${testID}-error`)]}>{error}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>
    </Host>
  );
}
