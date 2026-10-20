import { FloatingActionButton, Host, Icon } from "@expo/ui/jetpack-compose";
import { semantics, testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import { View } from "react-native";
import addIcon from "../../../assets/icons/add.xml";
import { useThemeColors } from "../use-theme";
import type { AddButtonProps } from "./types";

/**
 * Material 3 `FloatingActionButton` with an add icon, bottom-right over the screen; container `primary`, icon
 * `primary-foreground`. `label` is its accessible name. Render it as a sibling after the scrolling content.
 */
export function AddButton({ label, onPress, testID }: AddButtonProps) {
  const theme = useThemeColors();
  return (
    <View pointerEvents="box-none" className="absolute right-4 bottom-6">
      <Host matchContents>
        <FloatingActionButton
          containerColor={theme.primary}
          onClick={onPress}
          modifiers={[semantics({ contentDescription: label }), testIDModifier(testID)]}
        >
          <FloatingActionButton.Icon>
            <Icon source={addIcon} tint={theme["primary-foreground"]} size={24} />
          </FloatingActionButton.Icon>
        </FloatingActionButton>
      </Host>
    </View>
  );
}
