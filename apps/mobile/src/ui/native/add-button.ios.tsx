import { Button, Host } from "@expo/ui/swift-ui";
import { labelStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { useThemeColors } from "../use-theme";
import type { AddButtonProps } from "./types";

/**
 * The top-right "+" of the screen's navigation bar: a SwiftUI `Button` with the SF Symbol `plus`, icon only, tint
 * `primary`. `label` is its accessible name. Render it anywhere in a stack screen.
 */
export function AddButton({ label, onPress, testID }: AddButtonProps) {
  const theme = useThemeColors();
  return (
    <Stack.Screen
      options={{
        headerRight: () => (
          <Host matchContents>
            <Button
              label={label}
              systemImage="plus"
              onPress={onPress}
              testID={testID}
              modifiers={[labelStyle("iconOnly"), tint(theme.primary)]}
            />
          </Host>
        ),
      }}
    />
  );
}
