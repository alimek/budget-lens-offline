import { DatePicker, Host } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  datePickerStyle,
  labelsHidden,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";
import { calendarDateToLocal, localToCalendarDate } from "../calendar-date";
import { Text } from "../components/text";
import { useThemeColors } from "../use-theme";
import type { DatePickerProps } from "./types";

/**
 * SwiftUI compact `DatePicker` (date only, tint `primary`) under its label, like the text fields. The picker carries
 * the label as its accessible name; the visible label is hidden from accessibility. Works on local midnight of the
 * calendar day.
 */
export function AppDatePicker({ label, value, onValueChange, testID }: DatePickerProps) {
  const theme = useThemeColors();
  return (
    <View className="items-start gap-1 self-stretch">
      <Text variant="footnote" className="text-muted-foreground" accessibilityElementsHidden>
        {label}
      </Text>
      <Host matchContents>
        <DatePicker
          title={label}
          selection={calendarDateToLocal(value)}
          displayedComponents={["date"]}
          onDateChange={(date) => onValueChange(localToCalendarDate(date))}
          testID={testID}
          modifiers={[
            datePickerStyle("compact"),
            labelsHidden(),
            tint(theme.primary),
            accessibilityLabel(label),
          ]}
        />
      </Host>
    </View>
  );
}
