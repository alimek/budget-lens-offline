import type { PropsWithChildren } from "react";
import { ScrollView } from "react-native";
import { cn } from "@/ui/lib/utils";

interface ScreenProps {
  /** Screen root test ID, `screen-<name>` (docs/mobile-development.md#test-ids). */
  testID: string;
  contentClassName?: string;
}

/** Scrollable screen root on the `background` token with the 16 pt gutter. */
export function Screen({ testID, contentClassName, children }: PropsWithChildren<ScreenProps>) {
  return (
    <ScrollView
      testID={testID}
      collapsable={false}
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName={cn("gap-4 px-4 py-6", contentClassName)}
    >
      {children}
    </ScrollView>
  );
}
