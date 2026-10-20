import { Host, LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import { budgetProgress } from "../progress";
import { useThemeColors } from "../use-theme";
import type { BudgetProgressProps } from "./types";

/** Material 3 `LinearProgressIndicator`; colour `primary`, `expense` once over budget. */
export function BudgetProgress({ spent, budget, testID }: BudgetProgressProps) {
  const theme = useThemeColors();
  const { fraction, over } = budgetProgress(spent, budget);
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <LinearProgressIndicator
        progress={fraction}
        color={over ? theme.expense : theme.primary}
        trackColor={theme.muted}
        modifiers={[fillMaxWidth(), testIDModifier(testID)]}
      />
    </Host>
  );
}
