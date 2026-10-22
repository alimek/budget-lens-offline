import {
  Button,
  ContextMenu,
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  SwipeActions,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityAddTraits,
  accessibilityElement,
  accessibilityIdentifier,
  accessibilityLabel,
  background,
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  listStyle,
  monospacedDigit,
  onTapGesture,
  padding,
  shapes,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount, toneColorToken } from "../amount";
import { tinted } from "../lib/theme";
import { useLanguage } from "../use-language";
import { useStackedRows } from "../use-stacked-rows";
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

/** SwiftUI inset grouped `List`; fills its parent, which scrolls it. */
export function GroupedList({ testID, children }: GroupedListProps) {
  return (
    <Host style={{ flex: 1 }}>
      <List testID={testID} modifiers={[listStyle("insetGrouped")]}>
        {children}
      </List>
    </Host>
  );
}

/**
 * A SwiftUI `Section` with a system-styled header and an optional muted footer. The test ID sits on the header:
 * on a `Section` SwiftUI would apply it to every row.
 */
export function ListSection({ title, testID, footer, children }: ListSectionProps) {
  const theme = useThemeColors();
  return (
    <Section
      header={
        title === undefined ? undefined : (
          <Text
            modifiers={[
              accessibilityIdentifier(testID ?? ""),
              accessibilityAddTraits(["isHeader"]),
            ]}
          >
            {title}
          </Text>
        )
      }
      footer={
        footer === undefined ? undefined : (
          <Text
            modifiers={[
              font({ textStyle: "footnote" }),
              foregroundStyle(theme["muted-foreground"]),
            ]}
          >
            {footer}
          </Text>
        )
      }
    >
      {children}
    </Section>
  );
}

/**
 * A plain list row that opens a pushed screen: label, spacer, `chevron.right`. One VoiceOver element named by
 * `label`, or by `accessibilityLabel` when the row gives one; its test ID and press handler are the row's own.
 * An optional muted `detail` sits before the chevron, which is where the "Archived items" row shows its count.
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
    <HStack
      spacing={12}
      modifiers={[
        // A `Button` here hit-tests only its visible content, so a tap in the middle of the row – over the
        // `Spacer` – would do nothing. A tap gesture on the row with a rectangular content shape takes the whole
        // row instead, which is what a list row that goes somewhere is.
        contentShape(shapes.rectangle()),
        onTapGesture(onPress),
        accessibilityElement("combine"),
        accessibilityLabel(name ?? label),
        accessibilityIdentifier(testID),
        accessibilityAddTraits(["isButton"]),
      ]}
    >
      <Text modifiers={[foregroundStyle(theme.foreground)]}>{label}</Text>
      <Spacer />
      {detail === undefined ? null : (
        <Text
          modifiers={[
            font({ textStyle: "footnote" }),
            foregroundStyle(theme["muted-foreground"]),
            accessibilityIdentifier(detailTestId ?? ""),
          ]}
        >
          {detail}
        </Text>
      )}
      <Image systemName="chevron.right" size={13} color={theme["muted-foreground"]} />
    </HStack>
  );
}

/**
 * A `List` row: title, meta and badge, and the signed amount in `income` / `expense`.
 *
 * With a status (the default) the row also carries the paid button (`checkmark.circle.fill` / `circle`, `primary`)
 * named "Paid: <title>", and that button carries the test ID. With `showStatus={false}` the row has no control of
 * its own and becomes one VoiceOver element named by `accessibilityLabel`, identified by the test ID.
 *
 * `actions` are offered twice over, from the same list: as SwiftUI trailing swipe actions (`<testID>-<key>`), which
 * VoiceOver also offers as row actions, and in a `ContextMenu` that a long press opens (`<testID>-menu-<key>`).
 * A full swipe performs nothing: an action that asks for confirmation is chosen on purpose (#63).
 */
export function TransactionRow({ actions, onAction, ...row }: TransactionRowProps) {
  const { t } = useTranslation();
  if (!actions?.length) return <RowContent {...row} />;
  const named = (action: MenuAction<string>) =>
    t("transaction.actionLabel", { action: action.label, title: row.title });
  return (
    <ContextMenu>
      <ContextMenu.Trigger>
        <SwipeActions>
          <RowContent {...row} />
          <SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
            {actions.map((action) => (
              <SwipeButton
                key={action.key}
                action={action}
                title={row.title}
                testID={`${row.testID}-${action.key}`}
                onPress={() => onAction?.(action.key)}
              />
            ))}
          </SwipeActions.Actions>
        </SwipeActions>
      </ContextMenu.Trigger>
      <ContextMenu.Items>
        {actions.map((action) => (
          <Button
            key={action.key}
            label={action.label}
            role={action.destructive ? "destructive" : "default"}
            onPress={() => onAction?.(action.key)}
            modifiers={[
              accessibilityIdentifier(`${row.testID}-menu-${action.key}`),
              accessibilityLabel(named(action)),
            ]}
          />
        ))}
      </ContextMenu.Items>
    </ContextMenu>
  );
}

/** The paid control of a month-view row: the whole button is the toggle, named "Paid: <title>". */
function StatusButton({
  testID,
  title,
  paid,
  onPaidChange,
}: {
  readonly testID: string;
  readonly title: string;
  readonly paid: boolean;
  readonly onPaidChange: (paid: boolean) => void;
}) {
  const theme = useThemeColors();
  const { t } = useTranslation();
  const status = paid ? PAID : UNPAID;
  return (
    <Button
      onPress={() => onPaidChange(!paid)}
      testID={testID}
      modifiers={[
        buttonStyle("plain"),
        accessibilityLabel(t("transaction.paidLabel", { title })),
        accessibilityAddTraits([...status.traits]),
      ]}
    >
      <Image systemName={status.icon} size={22} color={theme.primary} />
    </Button>
  );
}

/**
 * The row itself: the paid button (unless the row has none), the texts and the amount. Which of the two it is
 * follows from `showStatus` alone.
 */
function RowContent(props: TransactionRowProps) {
  if (props.showStatus === false) return <StatuslessRowContent {...props} />;
  return <PaidRowContent {...props} />;
}

/**
 * The row without a paid status (#112): no control of its own, so the whole row is one VoiceOver element named by
 * `accessibilityLabel` and identified by the test ID. At accessibility text sizes the amount moves under the
 * title instead of squeezing it (`useStackedRows`).
 */
function StatuslessRowContent(props: StatuslessRowProps) {
  const stacked = useStackedRows();
  return (
    <HStack
      spacing={12}
      modifiers={[
        accessibilityElement("combine"),
        accessibilityLabel(props.accessibilityLabel),
        accessibilityIdentifier(props.testID),
      ]}
    >
      <RowTexts
        title={props.title}
        meta={props.meta}
        badge={props.badge}
        below={stacked ? <RowAmount {...props} /> : null}
      />
      <Spacer />
      {stacked ? null : <RowAmount {...props} />}
    </HStack>
  );
}

/** The row with the paid status: the whole row is the paid control, and the button carries the test ID. */
function PaidRowContent(props: PaidRowProps) {
  const stacked = useStackedRows();
  return (
    <HStack spacing={12}>
      <StatusButton
        testID={props.testID}
        title={props.title}
        paid={props.paid}
        onPaidChange={props.onPaidChange}
      />
      <RowTexts
        title={props.title}
        meta={props.meta}
        badge={props.badge}
        below={stacked ? <RowAmount {...props} /> : null}
      />
      <Spacer />
      {stacked ? null : <RowAmount {...props} />}
    </HStack>
  );
}

/** The amount of a row, formatted in the UI language and in the row's own currency. */
function RowAmount({ amount, currency, sign, amountNote }: TransactionRowProps) {
  const theme = useThemeColors();
  const lang = useLanguage();
  const formatted = formatAmount(amount, {
    lang,
    currency,
    ...(sign === undefined ? {} : { sign }),
  });
  return (
    <VStack alignment="trailing" spacing={0}>
      <Text modifiers={[monospacedDigit(), foregroundStyle(theme[toneColorToken(formatted.tone)])]}>
        {formatted.text}
      </Text>
      {amountNote === undefined ? null : (
        <Text
          modifiers={[font({ textStyle: "caption" }), foregroundStyle(theme["muted-foreground"])]}
        >
          {amountNote}
        </Text>
      )}
    </VStack>
  );
}

/** A swipe action: system destructive red, or `primary` for the others, named "<action>: <title>". */
function SwipeButton({
  action,
  title,
  testID,
  onPress,
}: {
  action: MenuAction<string>;
  title: string;
  testID: string;
  onPress: () => void;
}) {
  const theme = useThemeColors();
  const { t } = useTranslation();
  return (
    <Button
      label={action.label}
      role={action.destructive ? "destructive" : "default"}
      onPress={onPress}
      modifiers={[
        accessibilityIdentifier(testID),
        accessibilityLabel(t("transaction.actionLabel", { action: action.label, title })),
        ...(action.destructive ? [] : [tint(theme.primary)]),
      ]}
    />
  );
}

const PAID = { icon: "checkmark.circle.fill", traits: ["isToggle", "isSelected"] } as const;
const UNPAID = { icon: "circle", traits: ["isToggle"] } as const;

function RowTexts({
  title,
  meta,
  badge,
  below,
}: {
  title: string;
  meta: string | undefined;
  badge: string | undefined;
  below: ReactNode;
}) {
  const theme = useThemeColors();
  return (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[foregroundStyle(theme.foreground)]}>{title}</Text>
      {meta ? (
        <Text
          modifiers={[font({ textStyle: "footnote" }), foregroundStyle(theme["muted-foreground"])]}
        >
          {meta}
        </Text>
      ) : null}
      {badge ? <RowBadge text={badge} /> : null}
      {below}
    </VStack>
  );
}

/** The tinted badge of the #58 spec: `primary` text on 12 % `primary`, `caption`, 6 pt corners. */
function RowBadge({ text }: { text: string }) {
  const theme = useThemeColors();
  return (
    <Text
      modifiers={[
        font({ textStyle: "caption" }),
        foregroundStyle(theme.primary),
        padding({ horizontal: 6, vertical: 2 }),
        background(tinted(theme.primary, 12), shapes.roundedRectangle({ cornerRadius: 6 })),
      ]}
    >
      {text}
    </Text>
  );
}
