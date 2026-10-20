import { Host, Row, Switch, Text } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, toggleable, weight } from "@expo/ui/jetpack-compose/modifiers";
import { View } from "react-native";
import { useThemeColors } from "../use-theme";
import type { ToggleProps } from "./types";

/**
 * Material 3 `Switch` after its label; the whole row is the touch target. Compose exposes the row and the switch as
 * two unlabelled focus stops, so the accessibility tree comes from the React Native wrapper instead: one `switch`
 * named by `label` with its checked and disabled state, toggled by TalkBack's activate action. TalkBack reads
 * "<label>, switch, on/off". Checked track `primary`, thumb `primary-foreground`.
 */
export function AppToggle({ label, value, onValueChange, testID, disabled = false }: ToggleProps) {
  const theme = useThemeColors();
  const toggle = () => onValueChange(!value);
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      accessibilityActions={disabled ? [] : [{ name: "activate" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "activate") toggle();
      }}
      style={{ alignSelf: "stretch" }}
    >
      <View importantForAccessibility="no-hide-descendants">
        <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
          <Row
            verticalAlignment="center"
            horizontalArrangement={{ spacedBy: 8 }}
            modifiers={
              disabled
                ? [fillMaxWidth()]
                : [fillMaxWidth(), toggleable(value, toggle, { role: "switch" })]
            }
          >
            <Text color={theme.foreground} modifiers={[weight(1)]}>
              {label}
            </Text>
            <Switch
              value={value}
              onCheckedChange={onValueChange}
              enabled={!disabled}
              colors={{
                checkedTrackColor: theme.primary,
                checkedThumbColor: theme["primary-foreground"],
              }}
            />
          </Row>
        </Host>
      </View>
    </View>
  );
}
