import {
  DatePickerDialog,
  Host,
  OutlinedTextField,
  Text,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import {
  calendarDateToUtcMillis,
  formatCalendarDate,
  utcMillisToCalendarDate,
} from "../calendar-date";
import { useLanguage } from "../use-language";
import { useThemeColors } from "../use-theme";
import type { DatePickerProps } from "./types";

/**
 * A read-only Material 3 outlined field showing the formatted day; tapping it opens the M3 `DatePickerDialog`
 * (UTC-midnight selection, tint `primary`). The field is a single React Native button named
 * "<label>, <date>" for TalkBack; the Compose field is hidden from accessibility.
 */
export function AppDatePicker({ label, value, onValueChange, testID }: DatePickerProps) {
  const theme = useThemeColors();
  const { t } = useTranslation();
  const lang = useLanguage();
  const [open, setOpen] = useState(false);
  const formatted = formatCalendarDate(value, lang);
  const text = useNativeState(formatted);
  useEffect(() => {
    if (text.get() !== formatted) text.set(formatted);
  }, [text, formatted]);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: formatted }}
      onPress={() => setOpen(true)}
      style={{ alignSelf: "stretch" }}
    >
      <View importantForAccessibility="no-hide-descendants" pointerEvents="none">
        <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
          <OutlinedTextField
            value={text}
            readOnly
            enabled={false}
            singleLine
            colors={{
              disabledTextColor: theme.foreground,
              disabledIndicatorColor: theme["muted-foreground"],
              disabledLabelColor: theme["muted-foreground"],
              disabledContainerColor: "transparent",
            }}
            modifiers={[fillMaxWidth()]}
          >
            <OutlinedTextField.Label>
              <Text>{label}</Text>
            </OutlinedTextField.Label>
          </OutlinedTextField>
        </Host>
      </View>
      {open ? (
        <Host matchContents>
          <DatePickerDialog
            initialDate={new Date(calendarDateToUtcMillis(value)).toISOString()}
            color={theme.primary}
            confirmButtonLabel={t("common.ok")}
            dismissButtonLabel={t("common.cancel")}
            onDateSelected={(date) => {
              setOpen(false);
              onValueChange(utcMillisToCalendarDate(date.getTime()));
            }}
            onDismissRequest={() => setOpen(false)}
          />
        </Host>
      ) : null}
    </Pressable>
  );
}
