import { Host, Row, Switch, Text } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, testID as testIDModifier, weight } from "@expo/ui/jetpack-compose/modifiers";
import { useThemeColors } from "../use-theme";
import type { ToggleProps } from "./types";

/** Material 3 `Switch` after its label; checked track `primary`, thumb `primary-foreground`. */
export function AppToggle({ label, value, onValueChange, testID, disabled = false }: ToggleProps) {
  const theme = useThemeColors();
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <Row
        verticalAlignment="center"
        horizontalArrangement={{ spacedBy: 8 }}
        modifiers={[fillMaxWidth()]}
      >
        <Text color={theme.foreground} modifiers={[weight(1)]}>
          {label}
        </Text>
        <Switch
          value={value}
          enabled={!disabled}
          onCheckedChange={onValueChange}
          colors={{
            checkedTrackColor: theme.primary,
            checkedThumbColor: theme["primary-foreground"],
          }}
          modifiers={[testIDModifier(testID)]}
        />
      </Row>
    </Host>
  );
}
