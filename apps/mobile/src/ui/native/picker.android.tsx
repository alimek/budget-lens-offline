import {
  DropdownMenuItem,
  ExposedDropdownMenu,
  ExposedDropdownMenuBox,
  Host,
  OutlinedTextField,
  Text,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  menuAnchor,
  testID as testIDModifier,
} from "@expo/ui/jetpack-compose/modifiers";
import { useEffect, useState } from "react";
import { useThemeColors } from "../use-theme";
import type { PickerProps } from "./types";

/**
 * Material 3 exposed dropdown menu: a read-only outlined field (label = accessible name, value = selected option)
 * that opens the option menu. Focus `primary`.
 */
export function AppPicker<T extends string>({
  label,
  options,
  value,
  onValueChange,
  testID,
}: PickerProps<T>) {
  const theme = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const selected = options.find((option) => option.value === value)?.label ?? "";
  const text = useNativeState(selected);
  useEffect(() => {
    if (text.get() !== selected) text.set(selected);
  }, [text, selected]);
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <ExposedDropdownMenuBox
        expanded={expanded}
        onExpandedChange={setExpanded}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField
          value={text}
          readOnly
          singleLine
          colors={{
            focusedTextColor: theme.foreground,
            unfocusedTextColor: theme.foreground,
            focusedIndicatorColor: theme.primary,
            unfocusedIndicatorColor: theme["muted-foreground"],
            focusedLabelColor: theme.primary,
            unfocusedLabelColor: theme["muted-foreground"],
          }}
          modifiers={[menuAnchor(), fillMaxWidth(), testIDModifier(testID)]}
        >
          <OutlinedTextField.Label>
            <Text>{label}</Text>
          </OutlinedTextField.Label>
        </OutlinedTextField>
        <ExposedDropdownMenu
          expanded={expanded}
          onDismissRequest={() => setExpanded(false)}
          containerColor={theme.popover}
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              elementColors={{ textColor: theme["popover-foreground"] }}
              modifiers={[testIDModifier(`${testID}-${option.value}`)]}
              onClick={() => {
                onValueChange(option.value);
                setExpanded(false);
              }}
            >
              <DropdownMenuItem.Text>
                <Text>{option.label}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </ExposedDropdownMenu>
      </ExposedDropdownMenuBox>
    </Host>
  );
}
