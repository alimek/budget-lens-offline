import { Host, ProgressView } from "@expo/ui/swift-ui";
import { progressViewStyle, tint } from "@expo/ui/swift-ui/modifiers";
import type { ProgressIndicatorProps } from "./types";

/**
 * Linear SwiftUI `ProgressView`, or a circular indeterminate one when `fraction` is absent; accessibility comes
 * from the `BudgetProgress` container.
 */
export function ProgressIndicator({ fraction, color }: ProgressIndicatorProps) {
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <ProgressView
        {...(fraction === undefined ? {} : { value: fraction })}
        modifiers={[
          ...(fraction === undefined ? [progressViewStyle("circular")] : []),
          tint(color),
        ]}
      />
    </Host>
  );
}
