import type { MinorUnits } from "@budget-lens/core";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  testID: string;
  disabled?: boolean;
}

export interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID: string;
  disabled?: boolean;
}

export interface BudgetProgressProps {
  spent: MinorUnits;
  budget: MinorUnits;
  testID: string;
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  testID: string;
}
