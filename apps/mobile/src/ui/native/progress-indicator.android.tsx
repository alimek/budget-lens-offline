import { Host, LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import type { ProgressIndicatorProps } from "./types";

/** Material 3 `LinearProgressIndicator`; accessibility comes from the `BudgetProgress` container. */
export function ProgressIndicator({ fraction, color, trackColor }: ProgressIndicatorProps) {
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <LinearProgressIndicator
        progress={fraction}
        color={color}
        trackColor={trackColor}
        modifiers={[fillMaxWidth()]}
      />
    </Host>
  );
}
