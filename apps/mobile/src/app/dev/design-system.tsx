import { toMinorUnits } from "@budget-lens/core";
import { Redirect, useRouter } from "expo-router";
import { type PropsWithChildren, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { validateAmountInput } from "@/ui/amount-input";
import type { CalendarDate } from "@/ui/calendar-date";
import { AmountText } from "@/ui/components/amount-text";
import { Badge } from "@/ui/components/badge";
import { BudgetProgress } from "@/ui/components/budget-progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Separator } from "@/ui/components/separator";
import { Text } from "@/ui/components/text";
import { type ColorScheme, type ColorToken, colors } from "@/ui/lib/theme";
import { AppAlert } from "@/ui/native/alert";
import { PrimaryButton, SecondaryButton } from "@/ui/native/button";
import { AppContextMenu } from "@/ui/native/context-menu";
import { AppDatePicker } from "@/ui/native/date-picker";
import { AppPicker } from "@/ui/native/picker";
import { SegmentedControl } from "@/ui/native/segmented-control";
import { AppSheet } from "@/ui/native/sheet";
import { AppTextField } from "@/ui/native/text-field";
import { AppToggle } from "@/ui/native/toggle";
import type { TypeVariant } from "@/ui/typography";
import { useStackedRows } from "@/ui/use-stacked-rows";

const TYPE_VARIANTS: readonly TypeVariant[] = [
  "display",
  "title-1",
  "title-2",
  "title-3",
  "headline",
  "body",
  "callout",
  "subheadline",
  "footnote",
  "caption",
  "section-label",
];

const SCHEMES: readonly ColorScheme[] = ["light", "dark"];

type Scope = "only-this-month" | "from-this-month";

type Recurrence = "once" | "monthly" | "yearly";

function Section({
  title,
  testID,
  children,
}: PropsWithChildren<{ title: string; testID: string }>) {
  return (
    <View testID={testID} collapsable={false} className="gap-2">
      <Text variant="section-label">{title}</Text>
      {children}
    </View>
  );
}

function Swatches({ scheme }: { scheme: ColorScheme }) {
  const palette = colors[scheme];
  return (
    <View
      testID={`ds-swatches-${scheme}`}
      collapsable={false}
      className="flex-row flex-wrap gap-2 rounded-lg p-3"
      style={{ backgroundColor: palette.background }}
    >
      {(Object.keys(palette) as ColorToken[]).map((token) => (
        <View key={token} className="gap-1" style={{ width: "31%" }}>
          <View
            className="h-10 rounded-md border"
            style={{ backgroundColor: palette[token], borderColor: palette.border }}
          />
          <Text variant="caption" style={{ color: palette.foreground }} numberOfLines={2}>
            {token}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Dev-only showcase of every token and component (#119), used for review and screenshots. */
export default function DesignSystemScreen() {
  const { t } = useTranslation();
  const [privacyMode, setPrivacyMode] = useState(false);
  const [scope, setScope] = useState<Scope>("only-this-month");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("12,345");
  const [secret, setSecret] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("monthly");
  const [dueDate, setDueDate] = useState<CalendarDate>("2026-10-10");
  const router = useRouter();
  const amountResult = validateAmountInput(amount, "PLN");
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Screen testID="screen-design-system" contentClassName="gap-6">
      <Section title={t("dev.designSystem.components")} testID="ds-section-components">
        <SampleCard />
        <View className="flex-row flex-wrap gap-3">
          <PrimaryButton
            testID="ds-primary-button"
            label={t("dev.designSystem.primaryAction")}
            onPress={() => setPrivacyMode(false)}
          />
          <SecondaryButton
            testID="ds-secondary-button"
            label={t("dev.designSystem.secondaryAction")}
            onPress={() => setScope("only-this-month")}
          />
        </View>
        <Card>
          <AppToggle
            testID="ds-toggle"
            label={t("dev.designSystem.privacyMode")}
            value={privacyMode}
            onValueChange={setPrivacyMode}
          />
          <SegmentedControl<Scope>
            testID="ds-segmented"
            value={scope}
            onValueChange={setScope}
            options={[
              { value: "only-this-month", label: t("dev.designSystem.onlyThisMonth") },
              { value: "from-this-month", label: t("dev.designSystem.fromThisMonth") },
            ]}
          />
          <BudgetProgress
            testID="ds-progress"
            label={t("dev.designSystem.groceries")}
            spent={toMinorUnits(60_000)}
            budget={toMinorUnits(100_000)}
          />
          <BudgetProgress
            testID="ds-progress-over"
            label={t("dev.designSystem.eatingOut")}
            spent={toMinorUnits(120_000)}
            budget={toMinorUnits(100_000)}
          />
        </Card>
      </Section>
      <Section title={t("dev.designSystem.inputs")} testID="ds-section-inputs">
        <Card>
          <AppTextField
            testID="ds-text-field"
            label={t("dev.designSystem.name")}
            placeholder={t("dev.designSystem.namePlaceholder")}
            value={name}
            onChangeText={setName}
          />
          <AppTextField
            testID="ds-amount-field"
            label={t("dev.designSystem.amount")}
            kind="decimal"
            value={amount}
            onChangeText={setAmount}
            error={amountResult.ok ? undefined : t(amountResult.errorKey)}
          />
          <AppTextField
            testID="ds-secure-field"
            label={t("dev.designSystem.recoverySecret")}
            kind="secure"
            value={secret}
            onChangeText={setSecret}
          />
          <AppPicker<Recurrence>
            testID="ds-picker"
            label={t("dev.designSystem.recurrence")}
            value={recurrence}
            onValueChange={setRecurrence}
            options={[
              { value: "once", label: t("dev.designSystem.once") },
              { value: "monthly", label: t("dev.designSystem.monthly") },
              { value: "yearly", label: t("dev.designSystem.yearly") },
            ]}
          />
          <AppDatePicker
            testID="ds-date-picker"
            label={t("dev.designSystem.dueDate")}
            value={dueDate}
            onValueChange={setDueDate}
          />
        </Card>
      </Section>
      <Section title={t("dev.designSystem.overlays")} testID="ds-section-overlays">
        <Overlays />
      </Section>
      <Section title={t("dev.designSystem.lists")} testID="ds-section-lists">
        <SecondaryButton
          testID="ds-open-list"
          label={t("dev.designSystem.openList")}
          onPress={() => router.push("/dev/design-system-list")}
        />
      </Section>
      <Section title={t("dev.designSystem.amounts")} testID="ds-section-amounts">
        <Card>
          <AmountText amount={toMinorUnits(1_234_567)} lang="pl" testID="ds-amount-pl" />
          <AmountText amount={toMinorUnits(1_234_567)} lang="en" testID="ds-amount-en" />
          <AmountText amount={toMinorUnits(-1_234_567)} lang="pl" testID="ds-amount-negative" />
          <AmountText amount={toMinorUnits(0)} sign="always" testID="ds-amount-zero" />
        </Card>
      </Section>
      <Section title={t("dev.designSystem.typography")} testID="ds-section-typography">
        <Card>
          {TYPE_VARIANTS.map((variant) => (
            <View key={variant} testID={`ds-type-${variant}`} collapsable={false}>
              <Text variant="caption" className="text-muted-foreground">
                {variant}
              </Text>
              <Text variant={variant}>{t("dev.designSystem.sample")}</Text>
            </View>
          ))}
        </Card>
      </Section>
      <Section title={t("dev.designSystem.colors")} testID="ds-section-colors">
        {SCHEMES.map((scheme) => (
          <View key={scheme} className="gap-1">
            <Text variant="footnote">
              {t(
                scheme === "light" ? "dev.designSystem.colorsLight" : "dev.designSystem.colorsDark",
              )}
            </Text>
            <Swatches scheme={scheme} />
          </View>
        ))}
      </Section>
    </Screen>
  );
}

/** The #58 month summary card: sample amounts in label/amount rows. */
function SampleCard() {
  const { t } = useTranslation();
  return (
    <Card testID="ds-card">
      <CardHeader>
        <CardTitle>{t("dev.designSystem.cardTitle")}</CardTitle>
        <CardDescription>{t("dev.designSystem.cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge testID="ds-badge">
          <Text variant="caption">{t("dev.designSystem.changedThisMonth")}</Text>
        </Badge>
        <SummaryRow label={t("dev.designSystem.income")}>
          <AmountText amount={toMinorUnits(1_234_567)} sign="always" testID="ds-amount-income" />
        </SummaryRow>
        <Separator testID="ds-separator" />
        <SummaryRow label={t("dev.designSystem.expenses")}>
          <AmountText amount={toMinorUnits(-845_000)} testID="ds-amount-expense" />
        </SummaryRow>
        <Separator />
        <SummaryRow label={t("dev.designSystem.balance")} variant="headline">
          <AmountText
            amount={toMinorUnits(389_567)}
            size="amount-lg"
            colored={false}
            testID="ds-amount-total"
          />
        </SummaryRow>
      </CardContent>
    </Card>
  );
}

/** Label and amount on one line; stacked at accessibility text sizes so the label never breaks inside a word. */
function SummaryRow({
  label,
  variant = "body",
  children,
}: PropsWithChildren<{ label: string; variant?: "body" | "headline" }>) {
  const stacked = useStackedRows();
  return (
    <View className={stacked ? "gap-1" : "flex-row items-center justify-between gap-4"}>
      <Text variant={variant} className={stacked ? "" : "flex-1"}>
        {label}
      </Text>
      {children}
    </View>
  );
}

type MenuKey = "edit" | "duplicate" | "delete";

/** The overlay wrappers: a sheet, a confirmation alert and a menu of actions; the last result is shown as text. */
function Overlays() {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  return (
    <Card>
      <View className="flex-row flex-wrap gap-3">
        <PrimaryButton
          testID="ds-open-sheet"
          label={t("dev.designSystem.openSheet")}
          onPress={() => setSheetOpen(true)}
        />
        <SecondaryButton
          testID="ds-open-alert"
          label={t("dev.designSystem.secondaryAction")}
          onPress={() => setAlertOpen(true)}
        />
        <AppContextMenu<MenuKey>
          testID="ds-menu"
          label={t("dev.designSystem.moreActions")}
          actions={[
            { key: "edit", label: t("dev.designSystem.edit") },
            { key: "duplicate", label: t("dev.designSystem.duplicate") },
            { key: "delete", label: t("dev.designSystem.delete"), destructive: true },
          ]}
          onAction={(key) => setLastAction(t(`dev.designSystem.${key}`))}
        />
      </View>
      <Text testID="ds-overlay-result" variant="footnote" className="text-muted-foreground">
        {t("dev.designSystem.lastAction", { action: lastAction ?? t("dev.designSystem.noAction") })}
      </Text>
      <AppSheet
        testID="ds-sheet"
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        title={t("dev.designSystem.sheetTitle")}
      >
        <Text variant="body">{t("dev.designSystem.sheetBody")}</Text>
        <PrimaryButton
          testID="ds-sheet-done"
          label={t("dev.designSystem.done")}
          onPress={() => setSheetOpen(false)}
        />
      </AppSheet>
      <AppAlert
        testID="ds-alert"
        visible={alertOpen}
        title={t("dev.designSystem.closeMonthPrompt")}
        message={t("dev.designSystem.closeMonthMessage")}
        confirmLabel={t("dev.designSystem.secondaryAction")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => setLastAction(t("dev.designSystem.monthClosed"))}
        onDismiss={() => setAlertOpen(false)}
      />
    </Card>
  );
}
