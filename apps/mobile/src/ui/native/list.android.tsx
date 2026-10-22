import {
  Box,
  Button,
  Checkbox,
  Column,
  Host,
  Icon,
  ListItem,
  Text,
} from "@expo/ui/jetpack-compose";
import {
  background,
  clip,
  fillMaxWidth,
  padding,
  Shapes,
  semantics,
  testID as testIDModifier,
} from "@expo/ui/jetpack-compose/modifiers";
import { type ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import chevronIcon from "../../../assets/icons/chevron_right.xml";
import { type FormattedAmount, formatAmount, toneColorToken } from "../amount";
import { tinted } from "../lib/theme";
import { useLanguage } from "../use-language";
import { useThemeColors } from "../use-theme";
import type {
  GroupedListProps,
  ListSectionProps,
  MenuAction,
  NavigationRowProps,
  TransactionRowProps,
} from "./types";

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

/** A list subheader (M3 `titleSmall` in `primary`), its rows, and an optional muted footer. */
export function ListSection({ title, testID, footer, children }: ListSectionProps) {
  const theme = useThemeColors();
  return (
    <>
      {title === undefined ? null : (
        <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
          <Text
            color={theme.primary}
            style={{ typography: "titleSmall" }}
            modifiers={[fillMaxWidth(), padding(16, 16, 16, 8), testIDModifier(testID ?? "")]}
          >
            {title}
          </Text>
        </Host>
      )}
      {children}
      {footer === undefined ? null : (
        <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
          <Text
            color={theme["muted-foreground"]}
            style={{ typography: "bodySmall" }}
            modifiers={[fillMaxWidth(), padding(16, 16, 16, 8)]}
          >
            {footer}
          </Text>
        </Host>
      )}
    </>
  );
}

/**
 * A plain list row that opens a pushed screen: label, spacer, `chevron_right`. One accessibility element named by
 * `label` (the chevron is decoration and hidden from TalkBack).
 */
export function NavigationRow({ label, onPress, testID }: NavigationRowProps) {
  const theme = useThemeColors();
  return (
    <Pressable
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: theme["muted-foreground"], foreground: true }}
    >
      <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
        <ListItem
          colors={{ containerColor: theme.background, contentColor: theme.foreground }}
          modifiers={[fillMaxWidth()]}
        >
          <ListItem.HeadlineContent>
            <Text>{label}</Text>
          </ListItem.HeadlineContent>
          <ListItem.TrailingContent>
            <View importantForAccessibility="no-hide-descendants">
              <Icon source={chevronIcon} tint={theme["muted-foreground"]} size={20} />
            </View>
          </ListItem.TrailingContent>
        </ListItem>
      </Host>
    </Pressable>
  );
}

/**
 * Material 3 `ListItem`: headline, supporting texts and the signed amount in `income` / `expense`.
 *
 * With a status (the default) the whole row is the paid checkbox (M3 list-control pattern), named "Paid: <title>"
 * (`transaction.paidLabel`, as on iOS): TalkBack reads that name and the checked state as one control. With
 * `showStatus={false}` the row shows no checkbox and becomes one accessibility element named by
 * `accessibilityLabel`; tapping it is the edit sheet's (#82). `actions` are revealed by swiping the row to the
 * left (`ReanimatedSwipeable`) and stay in the accessibility tree either way.
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

/** The amount of a row as the list shows it: text and colour role, plus an optional note underneath. */
function AmountColumn({
  amount,
  note,
}: {
  readonly amount: FormattedAmount;
  readonly note: string | undefined;
}) {
  const theme = useThemeColors();
  return (
    <Column horizontalAlignment="end">
      <Text color={theme[toneColorToken(amount.tone)]}>{amount.text}</Text>
      {note === undefined ? null : <Text>{note}</Text>}
    </Column>
  );
}

/** The supporting texts of a row: the meta line and, below it, the badge of a scheduled change. */
function SupportingTexts({
  meta,
  badge,
}: {
  readonly meta: string | undefined;
  readonly badge: string | undefined;
}) {
  const lines: ReactNode[] = [];
  if (meta !== undefined) lines.push(<Text key="meta">{meta}</Text>);
  if (badge !== undefined) lines.push(<RowBadge key="badge" text={badge} />);
  if (lines.length === 0) return null;
  return (
    <ListItem.SupportingContent>
      <Column>{lines}</Column>
    </ListItem.SupportingContent>
  );
}

/** The Material 3 `ListItem` of a row: optional paid checkbox, headline, supporting texts and amount. */
function RowItem(props: TransactionRowProps) {
  const theme = useThemeColors();
  const { t } = useTranslation();
  const amount = formatAmount(props.amount, {
    lang: useLanguage(),
    currency: props.currency,
    ...(props.sign === undefined ? {} : { sign: props.sign }),
  });
  const content = (
    <ListItem
      colors={{
        containerColor: theme.background,
        contentColor: theme.foreground,
        supportingContentColor: theme["muted-foreground"],
      }}
      modifiers={[fillMaxWidth()]}
    >
      {props.showStatus === false ? null : (
        <ListItem.LeadingContent>
          <Checkbox
            value={props.paid}
            colors={{
              checkedColor: theme.primary,
              checkmarkColor: theme["primary-foreground"],
            }}
          />
        </ListItem.LeadingContent>
      )}
      <ListItem.HeadlineContent>
        <Text>{props.title}</Text>
      </ListItem.HeadlineContent>
      <SupportingTexts meta={props.meta} badge={props.badge} />
      <ListItem.TrailingContent>
        <AmountColumn amount={amount} note={props.amountNote} />
      </ListItem.TrailingContent>
    </ListItem>
  );
  // Keep touch handling outside Compose: its toggleable press indication survives swipe cancellation.
  const composed = (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
      <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
        {content}
      </Host>
    </View>
  );
  if (props.showStatus === false) {
    return (
      <Pressable
        testID={props.testID}
        accessible
        accessibilityLabel={props.accessibilityLabel}
        android_ripple={{ color: theme["muted-foreground"], foreground: true }}
      >
        {composed}
      </Pressable>
    );
  }
  return (
    <Pressable
      testID={props.testID}
      accessible
      accessibilityRole="checkbox"
      accessibilityLabel={t("transaction.paidLabel", { title: props.title })}
      accessibilityState={{ checked: props.paid }}
      accessibilityHint={[props.meta, props.badge, amount.text].filter(Boolean).join(", ")}
      onPress={() => props.onPaidChange(!props.paid)}
      android_ripple={{ color: theme["muted-foreground"], foreground: true }}
    >
      {composed}
    </Pressable>
  );
}

/** The tinted badge of the #58 spec: `primary` text on 12 % `primary`, `labelSmall`, 6 dp corners. */
function RowBadge({ text }: { text: string }) {
  const theme = useThemeColors();
  return (
    <Box modifiers={[clip(Shapes.RoundedCorner(6)), background(tinted(theme.primary, 12))]}>
      <Text
        color={theme.primary}
        style={{ typography: "labelSmall" }}
        modifiers={[padding(8, 2, 8, 2)]}
      >
        {text}
      </Text>
    </Box>
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
