import { DatePicker, Host } from "@expo/ui/swift-ui";
import { accessibilityLabel, datePickerStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { calendarDateToLocal, localToCalendarDate } from "../calendar-date";
import { useThemeColors } from "../use-theme";
import type { DatePickerProps } from "./types";

/**
 * SwiftUI compact `DatePicker` (date only): the title is the visible label and accessible name, tint `primary`.
 * Works on local midnight of the calendar day.
 */
export function AppDatePicker({ label, value, onValueChange, testID }: DatePickerProps) {
  const theme = useThemeColors();
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <DatePicker
        title={label}
        selection={calendarDateToLocal(value)}
        displayedComponents={["date"]}
        onDateChange={(date) => onValueChange(localToCalendarDate(date))}
        testID={testID}
        modifiers={[datePickerStyle("compact"), tint(theme.primary), accessibilityLabel(label)]}
      />
    </Host>
  );
}
