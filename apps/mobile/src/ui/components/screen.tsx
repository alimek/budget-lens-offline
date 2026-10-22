import type { PropsWithChildren } from "react";
import { Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/ui/lib/utils";

interface ScreenProps {
  /** Screen root test ID, `screen-<name>` (docs/mobile-development.md#test-ids). */
  testID: string;
  contentClassName?: string;
  /**
   * For a screen that renders without a navigator header and so has nothing else keeping it clear of the status
   * bar, such as the recovery screen of #242: iOS gets that from `contentInsetAdjustmentBehavior`, Android has no
   * equivalent and draws under the bar, so the screen is padded by the top inset and keeps its own gutter below
   * it. Screens under a header leave this out, or they would be inset twice.
   */
  topInset?: boolean;
}

/** Scrollable screen root on the `background` token with the 16 pt gutter. */
export function Screen({
  testID,
  contentClassName,
  topInset,
  children,
}: PropsWithChildren<ScreenProps>) {
  const insets = useSafeAreaInsets();
  const statusBar = topInset === true && Platform.OS === "android" ? insets.top : 0;
  return (
    <ScrollView
      testID={testID}
      collapsable={false}
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      style={statusBar > 0 ? { paddingTop: statusBar } : undefined}
      contentContainerClassName={cn("gap-4 px-4 py-6", contentClassName)}
    >
      {children}
    </ScrollView>
  );
}
