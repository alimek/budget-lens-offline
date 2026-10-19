import { NativeTabs } from "expo-router/native-tabs";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <NativeTabs disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="overview" testID="tab-overview">
        <NativeTabs.Trigger.Label>{t("nav.tabs.overview")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="dashboard" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="month" testID="tab-month">
        <NativeTabs.Trigger.Label>{t("nav.tabs.month")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="forecast" testID="tab-forecast">
        <NativeTabs.Trigger.Label>{t("nav.tabs.forecast")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" md="show_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="items" testID="tab-items">
        <NativeTabs.Trigger.Label>{t("nav.tabs.items")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" testID="tab-settings">
        <NativeTabs.Trigger.Label>{t("nav.tabs.settings")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
