import { toMinorUnits } from "@budget-lens/core";
import { Redirect } from "expo-router";
import { type PropsWithChildren, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { AmountText } from "@/ui/components/amount-text";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Separator } from "@/ui/components/separator";
import { Text } from "@/ui/components/text";
import { BudgetProgress } from "@/ui/native/budget-progress";
import { PrimaryButton, SecondaryButton } from "@/ui/native/button";
import { SegmentedControl } from "@/ui/native/segmented-control";
import { AppToggle } from "@/ui/native/toggle";
import { type ColorScheme, type ColorToken, colors } from "@/ui/theme";
import type { TypeVariant } from "@/ui/typography";

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
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Screen testID="screen-design-system" contentClassName="gap-6">
      <Section title={t("dev.designSystem.components")} testID="ds-section-components">
        <Card testID="ds-card">
          <CardHeader>
            <CardTitle>{t("dev.designSystem.cardTitle")}</CardTitle>
            <CardDescription>{t("dev.designSystem.cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge testID="ds-badge">
              <Text variant="caption">{t("dev.designSystem.changedThisMonth")}</Text>
            </Badge>
            <View className="flex-row items-center justify-between gap-4">
              <Text className="flex-1">{t("dev.designSystem.income")}</Text>
              <AmountText
                amount={toMinorUnits(1_234_567)}
                sign="always"
                testID="ds-amount-income"
              />
            </View>
            <Separator testID="ds-separator" />
            <View className="flex-row items-center justify-between gap-4">
              <Text className="flex-1">{t("dev.designSystem.expenses")}</Text>
              <AmountText amount={toMinorUnits(-845_000)} testID="ds-amount-expense" />
            </View>
            <Separator />
            <View className="flex-row flex-wrap items-center justify-between gap-x-4">
              <Text variant="headline" className="flex-1">
                {t("dev.designSystem.balance")}
              </Text>
              <AmountText
                amount={toMinorUnits(389_567)}
                size="amount-lg"
                colored={false}
                testID="ds-amount-total"
              />
            </View>
          </CardContent>
        </Card>
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
          <Text variant="footnote">{t("dev.designSystem.budgetUsed")}</Text>
          <BudgetProgress
            testID="ds-progress"
            spent={toMinorUnits(60_000)}
            budget={toMinorUnits(100_000)}
          />
          <Text variant="footnote">{t("dev.designSystem.overBudget")}</Text>
          <BudgetProgress
            testID="ds-progress-over"
            spent={toMinorUnits(120_000)}
            budget={toMinorUnits(100_000)}
          />
        </Card>
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
