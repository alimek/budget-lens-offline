import {
  Button,
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
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
} from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";
import { formatAmount, toneColorToken } from "../amount";
import { useLanguage } from "../use-language";
import { useThemeColors } from "../use-theme";
import type { GroupedListProps, ListSectionProps, TransactionRowProps } from "./types";

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
 * and the signed amount in `income` / `expense`. The status button is a toggle named "Paid: <title>".
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
  const { t } = useTranslation();
  const lang = useLanguage();
  const formatted = formatAmount(amount, { lang, currency: "PLN" });
  const amountColor = theme[toneColorToken(formatted.tone)];
  return (
    <HStack spacing={12}>
      <Button
        onPress={() => onPaidChange(!paid)}
        testID={testID}
        modifiers={[
          buttonStyle("plain"),
          accessibilityLabel(t("transaction.paidLabel", { title })),
          accessibilityAddTraits(paid ? ["isToggle", "isSelected"] : ["isToggle"]),
        ]}
      >
        <Image
          systemName={paid ? "checkmark.circle.fill" : "circle"}
          size={22}
          color={theme.primary}
        />
      </Button>
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[foregroundStyle(theme.foreground)]}>{title}</Text>
        {meta ? (
          <Text
            modifiers={[
              font({ textStyle: "footnote" }),
              foregroundStyle(theme["muted-foreground"]),
            ]}
          >
            {meta}
          </Text>
        ) : null}
      </VStack>
      <Spacer />
      <Text modifiers={[monospacedDigit(), foregroundStyle(amountColor)]}>{formatted.text}</Text>
    </HStack>
  );
}
