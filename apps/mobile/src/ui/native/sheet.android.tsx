import { Host, ModalBottomSheet, RNHostView } from "@expo/ui/jetpack-compose";
import { useThemeColors } from "../use-theme";
import { SheetContent } from "./sheet-content";
import type { SheetProps } from "./types";

/**
 * A Material 3 `ModalBottomSheet` on `card` with the drag handle. The title and the React Native children are
 * hosted inside it; swipe down, back or a tap on the scrim closes it.
 */
export function AppSheet({ visible, onDismiss, title, children, testID }: SheetProps) {
  const theme = useThemeColors();
  if (!visible) return null;
  return (
    <Host matchContents>
      <ModalBottomSheet
        onDismissRequest={onDismiss}
        containerColor={theme.card}
        contentColor={theme["card-foreground"]}
        skipPartiallyExpanded
      >
        <RNHostView matchContents={{ vertical: true }}>
          <SheetContent title={title} testID={testID}>
            {children}
          </SheetContent>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
}
