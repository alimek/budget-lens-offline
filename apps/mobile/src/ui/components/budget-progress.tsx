import type { MinorUnits } from "@budget-lens/core";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/ui/components/text";
import { ProgressIndicator } from "@/ui/native/progress-indicator";
import { budgetProgress } from "@/ui/progress";
import { useThemeColors } from "@/ui/use-theme";

interface BudgetProgressProps {
  /** Visible label and accessible name, e.g. the budget's name. */
  label: string;
  spent: MinorUnits;
  budget: MinorUnits;
  testID: string;
}

/**
 * Budget use: label, native linear progress (`primary`, `expense` once over budget) and a status line, so being over
 * budget is never shown by colour alone. Screen readers get one `progressbar` with the label and the percentage.
 */
export function BudgetProgress({ label, spent, budget, testID }: BudgetProgressProps) {
  const { t } = useTranslation();
  const theme = useThemeColors();
  const { fraction, over, percent } = budgetProgress(spent, budget);
  const status = over ? t("budget.overBudget", { percent }) : t("budget.used", { percent });
  return (
    <View
      testID={testID}
      collapsable={false}
      className="gap-1"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.min(percent, 100), text: status }}
    >
      <Text variant="footnote">{label}</Text>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <ProgressIndicator
          fraction={fraction}
          color={over ? theme.expense : theme.primary}
          trackColor={theme.muted}
        />
      </View>
      <Text
        variant="footnote"
        className={over ? "text-expense" : "text-muted-foreground"}
        testID={`${testID}-status`}
      >
        {status}
      </Text>
    </View>
  );
}
