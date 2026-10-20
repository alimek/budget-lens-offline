import { Host, ProgressView } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import type { ProgressIndicatorProps } from "./types";

/** Linear SwiftUI `ProgressView`; accessibility comes from the `BudgetProgress` container. */
export function ProgressIndicator({ fraction, color }: ProgressIndicatorProps) {
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <ProgressView value={fraction} modifiers={[tint(color)]} />
    </Host>
  );
}
