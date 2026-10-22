# PRD: Forecast, warnings & dashboard (E6)

Epic: [#28](https://github.com/alimek/budget-lens-offline/issues/28) · Status: proposed (open: [#46](https://github.com/alimek/budget-lens-offline/issues/46)) · decisions: [#44](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340102575), [#45](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340493501), [#36 Q1](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263044426), [#36 tabs](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530), [#124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950), [#35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802) · MVP

## Problem

People want to know months ahead whether their balance will drop too low, including the effect of bills in other
currencies.

## Goal

A forecast over a configurable horizon (default from `Settings`) of the rolling balance and total funds, **in the base
currency**. Foreign-currency items are converted at the latest cached NBP rate (or a newer manual rate), and the UI
shows which rates were used. Warnings (negative, low balance, large expense) use `Settings` thresholds. The **Dashboard (Overview tab) is
the first, main tab** of the app and summarizes it ([#36 Q1](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263044426)). Tabs follow [Variant A, chosen by @alimek](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530):
Overview, Month, Forecast, Items, Settings. Overview links to the full **Forecast** tab and has a **Savings** card that
opens the savings screen (E7); Savings is not a tab.

## Scope

**In:**
- Forecast core ([#6](https://github.com/alimek/budget-lens-offline/issues/6)).
- Foreign-currency conversion ([#140](https://github.com/alimek/budget-lens-offline/issues/140)).
- Forecast hook ([#88](https://github.com/alimek/budget-lens-offline/issues/88)), forecast screen with chart ([#89](https://github.com/alimek/budget-lens-offline/issues/89)), dashboard ([#90](https://github.com/alimek/budget-lens-offline/issues/90)).
- Chart library: **`react-native-chart-kit` 7.0.4 (`/v2` charts) on `react-native-svg` 15.16.0** (the SDK 58 pin),
  validated by a one-day spike on iOS and Android dev builds before #89 ([#218](https://github.com/alimek/budget-lens-offline/issues/218); [decided on #44](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340102575)).
  If the spike fails, the fallback is a hand-drawn chart on `react-native-svg`.
- Optional local notifications ([#91](https://github.com/alimek/budget-lens-offline/issues/91)): opt-in, local only, pre-scheduled on app open with
  `expo-notifications` ([#45 research](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340343141), [accepted](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340493501)).

**Out:**
- Server push notifications and push tokens (`getExpoPushTokenAsync` is never called).
- Exact alarms (`SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`) and background tasks for notifications.
- Post-MVP: a per-item "large bill" warning, disabling warnings, per-warning dismiss/snooze, caution-level
  notifications, custom notification time / quiet hours, an "amounts in notifications" toggle, a backup-overdue
  reminder ([#51](https://github.com/alimek/budget-lens-offline/issues/51)).
- Cloud or AI predictions.
- Live rate streaming.

## User stories

- As a user, I see my projected balance for each of the next 12 months.
- As a user, I get a warning when a month is projected below my low-balance threshold.
- As a user who turned notifications on, I get a local reminder on the 1st of a month projected below zero, and a
  reminder to close the previous month.
- As a user with a USD subscription, I see it included in base-currency terms, with the rate date and a stale badge
  when the quote is older than the Settings threshold (2 business days by default).
- As a user, I open the app on Overview (the Dashboard, first tab) and see my balance, the next warning, a mini
  forecast and a Savings card.

## Acceptance criteria (high level)

- The forecast is a pure, deterministic core function; all amounts in the output are in the base currency.
- Conversion uses the #124 strategy (one rounding, half away from zero). A missing rate gives a translatable
  warning, never a silent 0.
- Closed months use snapshotted rates; only open and future months use current rates.
- Warnings ([decided on #45](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340493501)): exactly the three core codes, all comparisons strict (`<`); zero
  thresholds don't disable them, and warnings can't be disabled in the MVP.

  | Code | Severity | Fires when |
  | --- | --- | --- |
  | `negative-balance` | critical | balance < 0 |
  | `low-balance` | caution | 0 ≤ balance < `lowBalanceThreshold` (a balance of 0 is low, not negative) |
  | `large-outflow` | info | the month's **net change** < −`largeExpenseThreshold` (UI copy "Big spending month") |

- Warnings are derived, never stored: recomputed by `forecast()` on app open, on item/override/payment/settings/rate
  changes and after a month close, fully offline. Identity and dedup key `(code, month)`; ordered by month, balance
  warning before outflow. No dismiss or snooze in the MVP.
- Overview shows the earliest warning plus "+N more" (or "No warnings in the next 13 months"); the Forecast tab shows
  the list, chart markers and month-row icons. Severity is always icon + text + spoken prefix, never colour alone.
- Missing rate, older (stale) rate, unclosed past month and backup overdue are status indicators on their own
  screens, not forecast warnings (#67).
- The forecast and chart start at the **active month**; past calendar months that are not closed yet are labelled
  "not closed" next to the catch-up banner, so their unsettled items stay in the projection ([#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002), row 3).
- Notifications ([#91](https://github.com/alimek/budget-lens-offline/issues/91), [#45](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340493501)):
  - Off by default. Permission is never asked in onboarding; it is asked in context (Settings → Notifications or
    "Remind me" on a critical warning) after a one-screen rationale. Denying it leaves in-app warnings working.
  - On every app open and after data, settings, language or time-zone changes: recompute, cancel this app's
    scheduled notifications, schedule at most 12 best-effort date triggers (no exact-alarm permission, no background
    task).
  - MVP types: a heads-up for each **critical** warning on the 1st of its month at 09:00 local time, at most one
    "coming up" notice 7 days before the first critical month, and a month-close reminder on the 1st at 09:00.
  - A dedup ledger of `(code, month, severity)` notifies again only when severity escalates; at most one notification
    per day (same-day items are merged).
  - Text is in the current language and contains **no amounts or item names**; Android `lockscreenVisibility` is
    PRIVATE.
- The chart uses full amounts (optionally whole units), with no compact axis labels such as "5K" / "5 tys."
  ([ADR 0012](../decisions/0012-native-intl-money-formatting.md)).
- Rates: rates are fetched **on app open** when a newer NBP table may exist (at most hourly retries before it is published); both sources become stale when at least `Settings.rateMaxAgeBusinessDays` business days (Mon–Fri, 2 by default, no Polish holidays in the MVP) lie between the effective date and today, per the [decision on #8, 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/8#issuecomment-6277037751), which supersedes the 24 h and fetch-age rules. Offline the last stored rate is used; **only the current rate per currency is stored** (no rate history) ([owner review #124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950), [owner review #35, Q7](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)). Manual rates (`1 X = y PLN`) win on a newer or equal effective date; cross rates go via PLN; table A only. At most one current NBP rate plus one current manual rate is kept per
  currency (owner-confirmed 2026-10-19, [#92](https://github.com/alimek/budget-lens-offline/issues/92#issuecomment-6276227995)).

## Success criteria

- Proposed target: the forecast for a 30-item, 3-currency budget computes in under 50 ms on device.
- Warnings match the thresholds in characterization and unit tests.

## Dependencies

- Core: [#6](https://github.com/alimek/budget-lens-offline/issues/6), [#140](https://github.com/alimek/budget-lens-offline/issues/140), [#8](https://github.com/alimek/budget-lens-offline/issues/8), [#124](https://github.com/alimek/budget-lens-offline/issues/124).
- Rates storage and refresh (E7, now an MVP prerequisite): [#92](https://github.com/alimek/budget-lens-offline/issues/92), [#93](https://github.com/alimek/budget-lens-offline/issues/93).
- DB: [#85](https://github.com/alimek/budget-lens-offline/issues/85).
- UI: [#67](https://github.com/alimek/budget-lens-offline/issues/67).

## Open questions

- Charting library: [#44](https://github.com/alimek/budget-lens-offline/issues/44) (Decided on [#44](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340102575) (2026-10-22): chart-kit 7.0.4 on react-native-svg
  15.16.0; minimum OS in [E1](app-shell-storage.md)).
- Warning semantics & notifications: [#45](https://github.com/alimek/budget-lens-offline/issues/45) (Decided on [#45](https://github.com/alimek/budget-lens-offline/issues/45#issuecomment-6340493501) (2026-10-22): all recommended
  defaults).
- NBP caching & refresh: triggers and max age decided ([owner review #124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950)); [#46](https://github.com/alimek/budget-lens-offline/issues/46) covers the remaining edge cases
  (weekends/holidays, errors, fixtures).
