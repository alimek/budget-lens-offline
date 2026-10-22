import {
  Box,
  Button,
  Checkbox,
  Column,
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Icon,
  ListItem,
  Row,
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
import { type ReactNode, useRef, useState } from "react";
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
  PaidRowProps,
  StatuslessRowProps,
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
 * A plain list row that opens a pushed screen: label, spacer, `chevron_right`. The row is one focusable element
 * named by `label`, or by `accessibilityLabel` when the row gives one; the texts inside it are not focusable, and
 * the chevron is decoration without a label of its own. An optional muted `detail` sits before the chevron, which
 * is where the "Archived items" row shows its count. Compose is measured against the viewport
 * (`useViewportSizeMeasurement`) because `matchContents` matches the height only, and every child of a slot is a
 * Compose view: putting a React Native view in a slot nests the two interop trees, which leaves the row without a
 * width and the icon unreported.
 */
export function NavigationRow({
  label,
  detail,
  detailTestId,
  accessibilityLabel: name,
  onPress,
  testID,
}: NavigationRowProps) {
  const theme = useThemeColors();
  return (
    <Pressable
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={name ?? label}
      onPress={onPress}
      android_ripple={{ color: theme["muted-foreground"], foreground: true }}
    >
      <Host
        matchContents={{ vertical: true }}
        useViewportSizeMeasurement
        style={{ alignSelf: "stretch" }}
      >
        <ListItem
          colors={{ containerColor: theme.background, contentColor: theme.foreground }}
          modifiers={[fillMaxWidth()]}
        >
          <ListItem.HeadlineContent>
            <Text>{label}</Text>
          </ListItem.HeadlineContent>
          <ListItem.TrailingContent>
            <Row verticalAlignment="center">
              {detail === undefined ? null : (
                <Text
                  color={theme["muted-foreground"]}
                  style={{ typography: "bodySmall" }}
                  modifiers={[padding(0, 8, 0, 0), testIDModifier(detailTestId ?? "")]}
                >
                  {detail}
                </Text>
              )}
              <Icon source={chevronIcon} tint={theme["muted-foreground"]} size={20} />
            </Row>
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

/** The amount of a row as the list shows it: text and colour role, plus a muted note underneath. */
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
      {note === undefined ? null : (
        <Text color={theme["muted-foreground"]} style={{ typography: "bodySmall" }}>
          {note}
        </Text>
      )}
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

/** The signed amount of a row, in its own currency and the UI language. */
function useRowAmount(props: TransactionRowProps): FormattedAmount {
  const lang = useLanguage();
  return formatAmount(props.amount, {
    lang,
    currency: props.currency,
    ...(props.sign === undefined ? {} : { sign: props.sign }),
  });
}

/**
 * The Material 3 `ListItem` of a row: the paid checkbox where the row has one, the headline, the supporting
 * texts and the amount. Compose only – touch belongs to the React Native wrapper around it.
 */
function RowContent({
  title,
  meta,
  badge,
  amount,
  amountNote,
  checkbox,
}: {
  readonly title: string;
  readonly meta: string | undefined;
  readonly badge: string | undefined;
  readonly amount: FormattedAmount;
  readonly amountNote: string | undefined;
  /** The paid checkbox of a month-view row; an item row (#112) has none and passes `undefined`. */
  readonly checkbox: ReactNode;
}) {
  const theme = useThemeColors();
  return (
    <ListItem
      colors={{
        containerColor: theme.background,
        contentColor: theme.foreground,
        supportingContentColor: theme["muted-foreground"],
      }}
      modifiers={[fillMaxWidth()]}
    >
      {checkbox === undefined ? null : (
        <ListItem.LeadingContent>{checkbox}</ListItem.LeadingContent>
      )}
      <ListItem.HeadlineContent>
        <Text>{title}</Text>
      </ListItem.HeadlineContent>
      <SupportingTexts meta={meta} badge={badge} />
      <ListItem.TrailingContent>
        <AmountColumn amount={amount} note={amountNote} />
      </ListItem.TrailingContent>
    </ListItem>
  );
}

/**
 * The actions of a row in an M3 `DropdownMenu` anchored to it (#63: on Android the long press is the
 * discoverable path to them). Touch stays with React Native, so the Compose trigger never sees a press of its
 * own and `open` is the only thing that opens the menu.
 */
function RowMenu({
  actions,
  testID,
  open,
  onOpenChange,
  onAction,
  children,
}: {
  readonly actions: readonly MenuAction<string>[];
  readonly testID: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onAction: ((key: string) => void) | undefined;
  readonly children: ReactNode;
}) {
  const theme = useThemeColors();
  return (
    <DropdownMenu
      expanded={open}
      onDismissRequest={() => onOpenChange(false)}
      color={theme.popover}
    >
      <DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Items>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            elementColors={{
              textColor: action.destructive ? theme.destructive : theme["popover-foreground"],
            }}
            modifiers={[testIDModifier(`${testID}-menu-${action.key}`)]}
            onClick={() => {
              onOpenChange(false);
              onAction?.(action.key);
            }}
          >
            <DropdownMenuItem.Text>
              <Text>{action.label}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
        ))}
      </DropdownMenu.Items>
    </DropdownMenu>
  );
}

/** The row and its Compose host: React Native owns the touch, Compose the pixels (`RowItem`). */
function RowSurface({ children }: { readonly children: ReactNode }) {
  return (
    // Keep touch handling outside Compose: its toggleable press indication survives swipe cancellation.
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
      <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
        {children}
      </Host>
    </View>
  );
}

/**
 * The row without a paid status (#112): one accessibility element named by `accessibilityLabel`, and a long
 * press that opens the row's actions in a `DropdownMenu` next to the swipe.
 */
function StatuslessRow(props: StatuslessRowProps) {
  const theme = useThemeColors();
  const [open, setOpen] = useState(false);
  const amount = useRowAmount(props);
  const actions = props.actions ?? [];
  const content = (
    <RowContent
      title={props.title}
      meta={props.meta}
      badge={props.badge}
      amount={amount}
      amountNote={props.amountNote}
      checkbox={undefined}
    />
  );
  return (
    <Pressable
      testID={props.testID}
      accessible
      accessibilityLabel={props.accessibilityLabel}
      onLongPress={actions.length === 0 ? undefined : () => setOpen(true)}
      android_ripple={{ color: theme["muted-foreground"], foreground: true }}
    >
      <RowSurface>
        {actions.length === 0 ? (
          content
        ) : (
          <RowMenu
            actions={actions}
            testID={props.testID}
            open={open}
            onOpenChange={setOpen}
            onAction={props.onAction}
          >
            {content}
          </RowMenu>
        )}
      </RowSurface>
    </Pressable>
  );
}

/** The row with the paid status: the whole row is the paid checkbox, and the checkbox shows in the row. */
function PaidRow(props: PaidRowProps) {
  const theme = useThemeColors();
  const { t } = useTranslation();
  const amount = useRowAmount(props);
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
      <RowSurface>
        <RowContent
          title={props.title}
          meta={props.meta}
          badge={props.badge}
          amount={amount}
          amountNote={props.amountNote}
          checkbox={
            <Checkbox
              value={props.paid}
              colors={{
                checkedColor: theme.primary,
                checkmarkColor: theme["primary-foreground"],
              }}
            />
          }
        />
      </RowSurface>
    </Pressable>
  );
}

/** The Material 3 row of a list, with or without the paid status. */
function RowItem(props: TransactionRowProps) {
  return props.showStatus === false ? <StatuslessRow {...props} /> : <PaidRow {...props} />;
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
