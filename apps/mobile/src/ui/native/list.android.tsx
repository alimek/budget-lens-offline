import { Button, Checkbox, Host, ListItem, Text } from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  padding,
  semantics,
  testID as testIDModifier,
} from "@expo/ui/jetpack-compose/modifiers";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { formatAmount, toneColorToken } from "../amount";
import { useLanguage } from "../use-language";
import { useThemeColors } from "../use-theme";
import type { GroupedListProps, ListSectionProps, MenuAction, TransactionRowProps } from "./types";

/**
 * A scrolling column on `background` with Material 3 rows. React Native scrolls it (not a Compose `LazyColumn`) so
 * that rows can take gesture-handler swipe actions, which Expo UI has no Compose equivalent for.
 */
export function GroupedList({ testID, children }: GroupedListProps) {
  const theme = useThemeColors();
  return (
    <ScrollView testID={testID} style={{ flex: 1, backgroundColor: theme.background }}>
      {children}
    </ScrollView>
  );
}

/** A list subheader (M3 `titleSmall` in `primary`) followed by its rows. */
export function ListSection({ title, testID, children }: ListSectionProps) {
  const theme = useThemeColors();
  return (
    <>
      <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
        <Text
          color={theme.primary}
          style={{ typography: "titleSmall" }}
          modifiers={[fillMaxWidth(), padding(16, 16, 16, 8), testIDModifier(testID)]}
        >
          {title}
        </Text>
      </Host>
      {children}
    </>
  );
}

/**
 * Material 3 `ListItem`: leading `Checkbox` (`primary`), headline, supporting meta and the signed amount in
 * `income` / `expense`. The whole row is the paid checkbox (M3 list-control pattern), named "Paid: <title>"
 * (`transaction.paidLabel`, as on iOS); TalkBack reads that name and the checked state as one control.
 * `actions` are revealed by swiping the row to the left (react-native-gesture-handler `ReanimatedSwipeable`).
 */
export function TransactionRow(props: TransactionRowProps) {
  const { actions, onAction, title, testID } = props;
  const swipeable = useRef<SwipeableMethods>(null);
  const theme = useThemeColors();
  if (!actions?.length) return <RowItem {...props} />;
  return (
    <Swipeable
      ref={swipeable}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={{ backgroundColor: theme.background }}
      renderRightActions={() => (
        <RowActions
          actions={actions}
          title={title}
          testID={testID}
          onAction={(key) => {
            swipeable.current?.close();
            onAction?.(key);
          }}
        />
      )}
    >
      <RowItem {...props} />
    </Swipeable>
  );
}

function RowItem({
  title,
  meta,
  amount,
  currency,
  paid,
  onPaidChange,
  testID,
}: TransactionRowProps) {
  const theme = useThemeColors();
  const { t } = useTranslation();
  const lang = useLanguage();
  const formatted = formatAmount(amount, { lang, currency });
  const amountColor = theme[toneColorToken(formatted.tone)];
  return (
    <Pressable
      testID={testID}
      accessible
      accessibilityRole="checkbox"
      accessibilityLabel={t("transaction.paidLabel", { title })}
      accessibilityState={{ checked: paid }}
      accessibilityHint={[meta, formatted.text].filter(Boolean).join(", ")}
      onPress={() => onPaidChange(!paid)}
      android_ripple={{ color: theme["muted-foreground"], foreground: true }}
    >
      {/* Keep touch handling outside Compose: its toggleable press indication survives swipe cancellation. */}
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
        <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
          <ListItem
            colors={{
              containerColor: theme.background,
              contentColor: theme.foreground,
              supportingContentColor: theme["muted-foreground"],
            }}
            modifiers={[fillMaxWidth()]}
          >
            <ListItem.LeadingContent>
              <Checkbox
                value={paid}
                colors={{
                  checkedColor: theme.primary,
                  checkmarkColor: theme["primary-foreground"],
                }}
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
        </Host>
      </View>
    </Pressable>
  );
}

/**
 * The buttons behind a row: filled M3 buttons in `destructive` or `primary`, each named "<action>: <title>"
 * (`transaction.actionLabel`). They stay in the accessibility tree while the row is closed, so TalkBack users reach
 * them without the swipe.
 */
function RowActions({
  actions,
  title,
  testID,
  onAction,
}: {
  actions: readonly MenuAction<string>[];
  title: string;
  testID: string;
  onAction: (key: string) => void;
}) {
  const theme = useThemeColors();
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-2 px-2">
      {/* Laid out from the outer edge inwards, so the first action is the trailing-most, as on iOS. */}
      {[...actions].reverse().map((action) => (
        <Host key={action.key} matchContents>
          <Button
            onClick={() => onAction(action.key)}
            colors={{
              containerColor: action.destructive ? theme.destructive : theme.primary,
              contentColor: theme["primary-foreground"],
            }}
            modifiers={[
              semantics({
                contentDescription: t("transaction.actionLabel", { action: action.label, title }),
              }),
              testIDModifier(`${testID}-${action.key}`),
            ]}
          >
            <Text>{action.label}</Text>
          </Button>
        </Host>
      ))}
    </View>
  );
}
