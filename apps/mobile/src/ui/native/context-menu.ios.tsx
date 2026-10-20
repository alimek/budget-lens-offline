import { Button, Host, Menu } from "@expo/ui/swift-ui";
import { accessibilityIdentifier, buttonStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { useThemeColors } from "../use-theme";
import type { ContextMenuProps } from "./types";

/**
 * A SwiftUI `Menu`: a bordered button (`ellipsis.circle`, tint `primary`) that opens the system menu of actions;
 * destructive actions use the system destructive style.
 */
export function AppContextMenu<K extends string>({
  label,
  actions,
  onAction,
  testID,
}: ContextMenuProps<K>) {
  const theme = useThemeColors();
  return (
    <Host matchContents>
      <Menu
        label={label}
        systemImage="ellipsis.circle"
        modifiers={[buttonStyle("bordered"), tint(theme.primary), accessibilityIdentifier(testID)]}
      >
        {actions.map((action) => (
          <Button
            key={action.key}
            label={action.label}
            role={action.destructive ? "destructive" : "default"}
            onPress={() => onAction(action.key)}
            modifiers={[accessibilityIdentifier(`${testID}-${action.key}`)]}
          />
        ))}
      </Menu>
    </Host>
  );
}
