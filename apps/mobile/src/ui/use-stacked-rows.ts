import { useWindowDimensions } from "react-native";
import { shouldStackRows } from "./large-text";

/** `true` when the system text size is large enough that label/amount rows should stack (see `shouldStackRows`). */
export function useStackedRows(): boolean {
  return shouldStackRows(useWindowDimensions().fontScale);
}
