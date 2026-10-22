// Development-only spike screen (#218): does `react-native-chart-kit` 7.0.4 (its `/v2` charts) render and take a
// tap on Expo SDK 58's new architecture, on `react-native-svg` 15.16.0? The forecast-style sample of
// `@/dev/forecast-chart` stands in for the E6 forecast screen this validates (#89): two series, the zero line, the
// low-balance threshold, full amounts on the axis (ADR 0012) and a month readout for the tapped point.
// Every label goes through i18n; the amounts stay integer minor units until `formatMoney` renders them.
import { formatMoney, toYearMonth } from "@budget-lens/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import { LineChart } from "react-native-chart-kit/v2";
import {
  chartValueToMinorUnits,
  forecastChartDomain,
  forecastChartRows,
  forecastSample,
  LOW_BALANCE_THRESHOLD,
} from "@/dev/forecast-chart";
import { formatMonthName } from "@/i18n/format-month-name";
import { AmountText } from "@/ui/components/amount-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";
import { useLanguage } from "@/ui/use-language";

/** A fixed horizon, so an e2e run can name the month and the amount a tap must report. */
const START_MONTH = toYearMonth("2026-11");

/** The 16 pt gutter of `Screen` and the 16 pt padding of `Card`, on both sides. */
const HORIZONTAL_INSET = 64;

const CHART_HEIGHT = 240;

function ReadoutRow({
  testID,
  label,
  amount,
}: {
  readonly testID: string;
  readonly label: string;
  readonly amount: number;
}) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Text variant="body">{label}</Text>
      <AmountText amount={chartValueToMinorUnits(amount)} testID={testID} colored={false} />
    </View>
  );
}

/**
 * The #218 spike: renders the sample forecast as a line chart and reports the tapped month. Registered only
 * inside the `__DEV__`-guarded block of the root layout, so a release build never mounts it (#75 R7).
 */
export default function DevChartSpike() {
  const { t } = useTranslation();
  const language = useLanguage();
  const { width } = useWindowDimensions();
  const [tapped, setTapped] = useState<number>();

  if (!__DEV__) {
    return null;
  }

  const sample = forecastSample(START_MONTH);
  const rows = forecastChartRows(sample);
  const selected = tapped === undefined ? undefined : rows[tapped];

  return (
    <Screen testID="screen-dev-chart-spike">
      <Card>
        <CardHeader>
          <CardTitle accessibilityRole="header">{t("dev.chartSpike.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text variant="subheadline">{t("dev.chartSpike.intro")}</Text>
          <LineChart
            accessibilityLabel={t("dev.chartSpike.description")}
            data={rows}
            formatXLabel={(value) => formatMonthName(String(value), language, { style: "short" })}
            formatYLabel={(value) =>
              formatMoney(chartValueToMinorUnits(value), {
                currency: "PLN",
                lang: language,
                fractionDigits: 0,
              })
            }
            height={CHART_HEIGHT}
            interaction={{
              mode: "tap",
              onSelect: (event) => setTapped(event.index),
              onDeselect: () => setTapped(undefined),
            }}
            legend
            referenceLines={[
              { y: 0, label: t("dev.chartSpike.zero") },
              {
                y: LOW_BALANCE_THRESHOLD / 100,
                label: t("dev.chartSpike.lowBalance"),
                strokeDasharray: [4, 4],
              },
            ]}
            series={[
              { yKey: "balance", label: t("dev.chartSpike.balance") },
              {
                yKey: "totalFunds",
                label: t("dev.chartSpike.totalFunds"),
                strokeDasharray: [6, 3],
              },
            ]}
            showDots
            testID="chart-spike-chart"
            width={Math.max(width - HORIZONTAL_INSET, 240)}
            xKey="month"
            yDomain={forecastChartDomain(sample)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          {selected === undefined ? (
            <Text testID="chart-spike-hint" variant="footnote">
              {t("dev.chartSpike.hint")}
            </Text>
          ) : (
            <>
              <Text testID="chart-spike-selected-month" variant="headline">
                {t("dev.chartSpike.selected", { month: selected.month })}
              </Text>
              <ReadoutRow
                testID="chart-spike-selected-balance"
                label={t("dev.chartSpike.balance")}
                amount={selected.balance}
              />
              <ReadoutRow
                testID="chart-spike-selected-total-funds"
                label={t("dev.chartSpike.totalFunds")}
                amount={selected.totalFunds}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Screen>
  );
}
