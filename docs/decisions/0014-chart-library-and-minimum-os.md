# 0014 – Chart library and minimum OS versions

Status: Accepted ([#44 decision](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340102575),
owner decision 2026-10-22; validated by the [#218 spike](https://github.com/alimek/budget-lens-offline/issues/218)
on development builds of both platforms the same day).

**Context.** E6's forecast screen (#89) needs a line chart with two series, a zero line, a low-balance threshold,
full amounts on the axis ([ADR 0012](0012-native-intl-money-formatting.md)) and tap-to-read-a-month. The #44 research
chose `react-native-chart-kit` 7.0.4 (its `/v2` charts) on `react-native-svg` 15.16.0 and minimum Android 8.0 plus
iOS 16.4, gated on a one-day spike, because v7 had only been released in June 2026. The fallback from #44 was a
hand-drawn `react-native-svg` chart.

**Decision.**
- `react-native-chart-kit` 7.0.4 with the `/v2` charts on `react-native-svg` 15.16.0, both pinned exactly
  ([ADR 0010](0010-dependency-versions.md)). 15.16.0 is also the version Expo SDK 58 pins, so no native module
  version exception is needed.
- Minimum OS: Android 8.0 (API 26) and iOS 16.4, set through `expo-build-properties` 58.0.11 (the SDK 58 pin) in
  `apps/mobile/app.json`: `{"android": {"minSdkVersion": 26}, "ios": {"deploymentTarget": "16.4"}}`.
- Amounts reach the chart as plain numbers only for drawing: callers hold `MinorUnits`, convert at the last moment,
  and format axis labels and readouts back through `formatMoney` with the full amount (ADR 0012).

**Spike evidence (#218).** A `__DEV__`-only route `budget-lens:///dev/chart-spike` renders a twelve-month forecast
sample (`apps/mobile/src/dev/forecast-chart.ts`) with two series, legend, zero line, threshold line and dotted
reference style, and reports the tapped month with both amounts. Development builds of both platforms from that
branch, new architecture on, build, render and take a tap; the e2e run is `apps/mobile/e2e/chart-spike.e2e.ts`.
Measured with `npx expo export --platform ios --platform android` (production Hermes bytecode, the same tree with
and without the chart screen and its data module): Android 5,405,828 → 5,947,112 bytes and iOS 5,294,294 →
5,830,870 bytes, so about +10 % of the JavaScript bundle on both platforms. Nothing outside `react-native-svg` is
pulled in by the chart's own hit testing: chart-kit 7.0.4 needs no Skia, Reanimated or Gesture Handler.

**Consequences.**
- `react-native-svg` is the only new native module: `react-native-chart-kit` 7.0.4 is plain JavaScript and
  `expo-build-properties` is a configuration plugin. The new native module and the new minimum OS still change the
  fingerprint, so the merged branch needs a new native build ([release/updates.md](../release/updates.md)). Until
  that build ships, installs on the current runtime – build 6 included – keep getting updates published from the old
  fingerprint and receive nothing published from this one, because an update never installs on a build whose
  runtime differs.
- iOS 16.4 is already the SDK 58 floor, so only Android loses devices: below API 26 (about 0.2 % of Polish and
  0.3 % of global mobile traffic, StatCounter September 2026, as measured on #44).
- With `interaction` in `tap` mode and `deselectOnOutsidePress` left on (the default), chart-kit covers the plot's
  margins with invisible outside-press surfaces, so a tap near the last point clears the selection instead of
  reporting it. Pass `deselectOnOutsidePress: false` when the chart's own margins should stay part of the tap area.
- Two reference lines close together draw their labels on top of each other; the forecast screen either places them
  apart or labels one of them in the legend instead (#89).
- Chart work is no longer expected to need the hand-drawn fallback.

**Rejected alternatives.** A hand-drawn `react-native-svg` chart (#44) – now unnecessary, and it would mean
maintaining axes, labels and hit testing ourselves. Skia-based options, `victory-native` and
`react-native-gifted-charts` were compared on #44: Skia 3 makes Vulkan 1.1 a required feature (an effective floor
near Android 10) and is very new, `victory-native` 43 does not support Skia 3, and gifted-charts has open New
Architecture tooltip bugs.
