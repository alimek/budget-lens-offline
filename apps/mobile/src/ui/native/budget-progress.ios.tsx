import { Host, ProgressView } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { budgetProgress } from "../progress";
import { useThemeColors } from "../use-theme";
import type { BudgetProgressProps } from "./types";

/** Linear SwiftUI `ProgressView`; tint `primary`, `expense` once over budget. */
export function BudgetProgress({ spent, budget, testID }: BudgetProgressProps) {
  const theme = useThemeColors();
  const { fraction, over } = budgetProgress(spent, budget);
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <ProgressView
        value={fraction}
        testID={testID}
        modifiers={[tint(over ? theme.expense : theme.primary)]}
      />
    </Host>
  );
}
