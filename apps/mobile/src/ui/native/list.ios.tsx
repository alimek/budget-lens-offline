import {
  Button,
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
  accessibilityIdentifier,
  accessibilityLabel,
  buttonStyle,
  font,
  foregroundStyle,
  listStyle,
  monospacedDigit,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount, toneColorToken } from "../amount";
import { useLanguage } from "../use-language";
import { useStackedRows } from "../use-stacked-rows";
import { useThemeColors } from "../use-theme";
import type { GroupedListProps, ListSectionProps, MenuAction, TransactionRowProps } from "./types";

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
 * A SwiftUI `Section` with a system-styled header. The test ID sits on the header: on a `Section` SwiftUI would
 * apply it to every row.
 */
export function ListSection({ title, testID, children }: ListSectionProps) {
  return (
    <Section
      header={
        <Text modifiers={[accessibilityIdentifier(testID), accessibilityAddTraits(["isHeader"])]}>
          {title}
        </Text>
      }
    >
      {children}
    </Section>
  );
}

/**
 * A `List` row: the paid status button (SF Symbol `checkmark.circle.fill` / `circle`, `primary`), title and meta,
 * and the signed amount in `income` / `expense`. The status button is a toggle named "Paid: <title>". `actions`
 * become SwiftUI trailing swipe actions (`<testID>-<key>`), which VoiceOver also offers as row actions.
 */
export function TransactionRow({ actions, onAction, ...row }: TransactionRowProps) {
  if (!actions?.length) return <RowContent {...row} />;
  return (
    <SwipeActions>
      <RowContent {...row} />
      <SwipeActions.Actions edge="trailing">
        {actions.map((action) => (
          <SwipeButton
            key={action.key}
            action={action}
            testID={`${row.testID}-${action.key}`}
            onPress={() => onAction?.(action.key)}
          />
        ))}
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

/** The row itself: status button, texts and amount. */
function RowContent({
  title,
  meta,
  amount,
  currency,
  paid,
  onPaidChange,
  testID,
}: Omit<TransactionRowProps, "actions" | "onAction">) {
  const theme = useThemeColors();
  const { t } = useTranslation();
  const lang = useLanguage();
  const formatted = formatAmount(amount, { lang, currency });
  const amountColor = theme[toneColorToken(formatted.tone)];
  const stacked = useStackedRows();
  const status = paid ? PAID : UNPAID;
  const amountText = (
    <Text modifiers={[monospacedDigit(), foregroundStyle(amountColor)]}>{formatted.text}</Text>
  );
  return (
    <HStack spacing={12}>
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
      {/* At accessibility text sizes the amount moves under the title instead of squeezing it. */}
      <RowTexts title={title} meta={meta} below={stacked ? amountText : null} />
      <Spacer />
      {stacked ? null : amountText}
    </HStack>
  );
}

/** A swipe action: system destructive red, or `primary` for the others. */
function SwipeButton({
  action,
  testID,
  onPress,
}: {
  action: MenuAction<string>;
  testID: string;
  onPress: () => void;
}) {
  const theme = useThemeColors();
  return (
    <Button
      label={action.label}
      role={action.destructive ? "destructive" : "default"}
      onPress={onPress}
      modifiers={[
        accessibilityIdentifier(testID),
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
  below,
}: {
  title: string;
  meta: string | undefined;
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
      {below}
    </VStack>
  );
}
