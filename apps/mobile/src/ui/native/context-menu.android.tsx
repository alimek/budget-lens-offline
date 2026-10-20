import {
  DropdownMenu,
  DropdownMenuItem,
  Host,
  OutlinedButton,
  Text,
} from "@expo/ui/jetpack-compose";
import { testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import { useState } from "react";
import { useThemeColors } from "../use-theme";
import type { ContextMenuProps } from "./types";

/**
 * A Material 3 `DropdownMenu` anchored to an outlined button (content `primary`); destructive items in
 * `destructive`.
 */
export function AppContextMenu<K extends string>({
  label,
  actions,
  onAction,
  testID,
}: ContextMenuProps<K>) {
  const theme = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  return (
    <Host matchContents>
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={() => setExpanded(false)}
        color={theme.popover}
      >
        <DropdownMenu.Trigger>
          <OutlinedButton
            onClick={() => setExpanded(true)}
            colors={{ contentColor: theme.primary }}
            modifiers={[testIDModifier(testID)]}
          >
            <Text>{label}</Text>
          </OutlinedButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.key}
              elementColors={{
                textColor: action.destructive ? theme.destructive : theme["popover-foreground"],
              }}
              modifiers={[testIDModifier(`${testID}-${action.key}`)]}
              onClick={() => {
                setExpanded(false);
                onAction(action.key);
              }}
            >
              <DropdownMenuItem.Text>
                <Text>{action.label}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}
