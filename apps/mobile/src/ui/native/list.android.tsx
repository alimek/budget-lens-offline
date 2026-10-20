import { Checkbox, Host, LazyColumn, ListItem, Text } from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  padding,
  testID as testIDModifier,
  toggleable,
} from "@expo/ui/jetpack-compose/modifiers";
import { formatAmount, toneColorToken } from "../amount";
import { useLanguage } from "../use-language";
import { useThemeColors } from "../use-theme";
import type { GroupedListProps, ListSectionProps, TransactionRowProps } from "./types";

/** Material 3 `LazyColumn` on `background`; fills its parent and scrolls itself. */
export function GroupedList({ testID, children }: GroupedListProps) {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn modifiers={[fillMaxSize(), testIDModifier(testID)]}>{children}</LazyColumn>
    </Host>
  );
}

/** A list subheader (M3 `titleSmall` in `primary`) followed by its rows. */
export function ListSection({ title, testID, children }: ListSectionProps) {
  const theme = useThemeColors();
  return (
    <>
      <Text
        color={theme.primary}
        style={{ typography: "titleSmall" }}
        modifiers={[padding(16, 16, 16, 8), testIDModifier(testID)]}
      >
        {title}
      </Text>
      {children}
    </>
  );
}

/**
 * Material 3 `ListItem`: leading `Checkbox` (`primary`), headline, supporting meta and the signed amount in
 * `income` / `expense`. The whole row is the paid checkbox (M3 list-control pattern), so TalkBack reads the texts
 * and the checked state as one control.
 */
export function TransactionRow({
  title,
  meta,
  amount,
  paid,
  onPaidChange,
  testID,
}: TransactionRowProps) {
  const theme = useThemeColors();
  const lang = useLanguage();
  const formatted = formatAmount(amount, { lang, currency: "PLN" });
  const amountColor = theme[toneColorToken(formatted.tone)];
  return (
    <ListItem
      colors={{
        containerColor: theme.background,
        contentColor: theme.foreground,
        supportingContentColor: theme["muted-foreground"],
      }}
      modifiers={[
        toggleable(paid, () => onPaidChange(!paid), { role: "checkbox" }),
        testIDModifier(testID),
      ]}
    >
      <ListItem.LeadingContent>
        <Checkbox
          value={paid}
          colors={{ checkedColor: theme.primary, checkmarkColor: theme["primary-foreground"] }}
        />
      </ListItem.LeadingContent>
      <ListItem.HeadlineContent>
        <Text>{title}</Text>
      </ListItem.HeadlineContent>
      {meta ? (
        <ListItem.SupportingContent>
          <Text>{meta}</Text>
        </ListItem.SupportingContent>
      ) : null}
      <ListItem.TrailingContent>
        <Text color={amountColor}>{formatted.text}</Text>
      </ListItem.TrailingContent>
    </ListItem>
  );
}
