import { BottomSheet, Group, Host, RNHostView } from "@expo/ui/swift-ui";
import { presentationDragIndicator } from "@expo/ui/swift-ui/modifiers";
import { SheetContent } from "./sheet-content";
import type { SheetProps } from "./types";

/**
 * A SwiftUI sheet sized to its content, with the system drag indicator and background. The title and the React
 * Native children are hosted inside it; swipe down closes it.
 */
export function AppSheet({ visible, onDismiss, title, children, testID }: SheetProps) {
  return (
    <Host matchContents>
      <BottomSheet
        isPresented={visible}
        fitToContents
        onIsPresentedChange={(presented) => {
          if (!presented) onDismiss();
        }}
      >
        <Group modifiers={[presentationDragIndicator("visible")]}>
          <RNHostView matchContents={{ vertical: true }}>
            <SheetContent title={title} testID={testID}>
              {children}
            </SheetContent>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
}
