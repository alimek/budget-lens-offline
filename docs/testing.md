# Testing guidelines

## Strategy

- **E2E tests are the main way the app is tested** (#15). They cover user flows on the app and use the open-source
  [e2e](https://github.com/tester-army/e2e) framework made by TesterArmy, configured with **our own models**; the hosted
  TesterArmy service is not used ([#15 e2e decisions
  comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252)). Which model provider to
  use is still an open decision in #15.
- **Unit tests are minimal:** only business logic in `packages/core`, plus the migrations and business-rule
  constraints of `packages/db`, written as Arrange-Act-Assert. The fewer, the
  better – add a unit test only when it protects a business rule that is not obvious from the code.
- **There are no percentage coverage thresholds**, anywhere (Vitest config or CI). Coverage is only reported.

## Tools

- **Unit tests:** Vitest in `packages/core` (`vitest.config.ts` includes both locations). Run with `pnpm test`.
  - `src/**/*.test.ts`, next to the code (e.g. `src/money.test.ts`).
  - Property-based tests use fast-check, in `src/**/*.property.test.ts` (see below).
  - `packages/core/test/` – legacy characterization tests (#3):
    - `*.characterization.test.ts` – the tests;
    - `fixtures/` – test data (legacy expenses and incomes, recorded NBP responses);
    - `legacy/` – test-only reference copies of the legacy functions;
    - `__snapshots__/` – Vitest snapshots;
    - `helpers.ts` – fixed time zone and frozen clock;
    - [`LEGACY.md`](../packages/core/test/LEGACY.md) – the list of `LEGACY:` behaviours.
- **Database tests:** Vitest in `packages/db/test/` on Node with sql.js (SQLite in WebAssembly, tests only). They
  cover migrating forward, re-running migrations, table rebuilds that keep child rows, the encrypted pre-migration
  copy (taken only when a migration is pending and restored when a migration or the post-commit integrity check
  fails, #75), the order of the "start over" steps (secure-storage probe, key paired with the file it opens,
  rename, live key dropped last, #217), the constraints that encode business rules (one active month, one rule
  version per item and month, singleton settings, required item currency, RESTRICT foreign keys), the business
  rules of the items and
  rule-version repository (#81: the base-currency default, the currency that cannot change after creation,
  archiving instead of deleting, both schedule shapes round-tripping, and a damaged row being reported instead of
  dropped) and those of the settings repository (#78: the defaults of a database with no row, core's validation
  codes with nothing written, a damaged field falling back to its default, and the onboarding timestamp an update
  keeps). SQLCipher itself (the key, the cipher guard, an encrypted copy on disk) is covered on devices (#75, e2e);
  see [packages/db](../packages/db/README.md#tests).
- **Typecheck of tests:** a separate TypeScript project.
  - `packages/core/tsconfig.json` covers `src` only, with `types: []`, so no Node.js types are available in core.
  - `packages/core/test/tsconfig.json` adds `types: ["node"]` and also checks `vitest.config.ts`.
  - The core `typecheck` script runs both: `tsc --noEmit && tsc --noEmit -p test`.
  - `@types/node` (24.x, matching `.nvmrc`) is a core devDependency used only by the tests.
- **Coverage:** `pnpm --filter @budget-lens/core test:coverage`; CI shows a coverage summary and uploads the report.
  It is informational only: no percentage threshold is configured or enforced.
- **E2E (app):** the `e2e` package (SDK, runner and CLI) with the `@e2e-dev/mobile` engine on iOS simulators and
  Android emulators. `screen.getByTestId()` finds elements by their React Native `testID`. Tests without agent steps
  (`agent.act()`, `agent.assert()`) need no model; agent steps and `e2e explore` use the configured model.
  Per #15, the first tests use `getByTestId` locators only, with no agent steps. The setup, `testID` convention
  and model configuration are defined in #15.
  - **E2E does not run in CI** (#166): it runs locally on a dev machine
    ([ci.md](ci.md#native-builds-and-e2e-local)).
  - **Telemetry must be disabled.** The `e2e` CLI sends anonymous usage telemetry by default
    ([e2e telemetry docs](https://e2e.tester.army/docs/telemetry)). Set `E2E_TELEMETRY_DISABLED=1` in every
    environment, like `TURBO_TELEMETRY_DISABLED` in `.github/workflows/ci.yml` ([#15 e2e decisions
    comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252)).
  - The model provider API key comes from the local environment on the local dev machine and never appears on
    GitHub ([#15 e2e decisions
    comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252); see
    [conventions.md](conventions.md#secrets)).
  - **UI PRs** include e2e evidence: **screenshots** (iOS + Android, simulator/emulator named; a video
    is also fine) from a TesterArmy `e2e` run or `e2e explore` on a local development build on a local dev machine, in the
    Screenshots section of the PR template. A manual screenshot from a development build alone is not enough.
  - Only **dedicated simulators/emulators** are used (`E2E_IOS_SIMULATOR` / `E2E_ANDROID_AVD`), never personal or
    shared devices.
  - Metro runs on the repo's **fixed port 8073**; see [mobile development](mobile-development.md).

## Rules

1. **Arrange-Act-Assert.** Every test has three clearly separated sections: set up the inputs, perform one action,
   check the outcome. Separate them with blank lines (and `// Arrange`, `// Act`, `// Assert` comments when the test
   is longer than a few lines). One action per test.
2. **Test business cases and logic only.** Do not write tests for trivial code (plain getters, re-exports, type-only
   modules), wiring (that a module exports something, that a provider renders) or framework/library behaviour
   (Drizzle, Expo, React, Vitest itself). **Reviewers flag tests that only exercise trivial code, wiring or framework
   behaviour** and ask for them to be removed or replaced by a business-behaviour test.
3. **No percentage coverage thresholds and no coverage goal.** Do not add tests to raise coverage. Keep unit tests
   few and focused on business rules (edge cases, boundaries, invalid input, regressions); user flows belong in e2e.
4. **Test names describe the business behaviour**, not the implementation: `"sums amounts without rounding errors"`,
   not `"calls reduce"`. Group with `describe` per function or behaviour.
5. **Deterministic.** New `packages/core` code takes the current month/time as an argument, so its tests pass fixed
   values instead of mocking the clock. Inject `fetch` and storage interfaces instead of hitting the network.
   **Exception:** characterization tests of legacy code (#3) run the legacy reference functions with a frozen clock
   (`vi.setSystemTime`), because legacy code reads `new Date()`.
6. **Money in tests** is created with `toMinorUnits`; never compare money with floats.

Example:

```ts
it("opens the next month with the closing balance of the closed month", () => {
  // Arrange
  const activeMonth = createInitialMonth(toYearMonth("2026-12"), toMinorUnits(100_000));
  if (!activeMonth.ok) throw new Error("Invalid test setup");

  // Act
  const result = closeMonth([activeMonth.value], {
    baseCurrency: "PLN",
    rates: {},
    currentMonth: toYearMonth("2026-12"),
    closingBalance: toMinorUnits(120_000),
    items: [],
    overrides: [],
    paymentStatuses: [],
  });

  // Assert
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.next).toMatchObject({ month: "2027-01", openingBalance: 120_000 });
});
```

## Property-based tests

Use [fast-check](https://fast-check.dev/) (`fc.assert(fc.property(...))` inside a Vitest `it`) for business
invariants that must hold for every input, not just a few examples: money arithmetic and parse/format round-trips
(#122), recurrence (occurrence counts, interval and anchor invariants, end dates, day-of-month clamping, #4). The same
rules apply: few properties, business-behaviour names, AAA inside the property. Keep the generated ranges realistic
(for example amounts whose sums stay safe integers) and do not fix a seed; on failure fast-check prints the seed and
the shrunk counterexample to reproduce it, which is how a CI failure is reproduced too.

The properties we have (#122 completes the set deferred from #18):
- `src/money.property.test.ts`: amounts are drawn from size bands (below 1 000, 1 000 – 999 999, up to 10^9 and up
  to 10^12 minor units) so typical, grouped amounts are as common as tiny and huge ones. `sumMinorUnits` equals the
  exact integer sum; `toMinorUnits` rejects every amount that is not a whole number of minor units; typing back what
  `formatMoney` printed (`parseMoney` of its digits, both languages) gives the same amount in every currency, over
  the full range (for currencies without minor digits, `JP¥1,000` reads as thousands, #164);
  `multiplyByRate` always returns whole minor units at most half a minor unit from the exact product and rounds an
  exact half away from zero; `convertMinor` only rescales at rate 1 into a currency with as many or more minor
  digits (and back losslessly), stays within half a target minor unit of the exact value, is odd (negating the
  amount negates the result) and monotonic in the amount, and agrees with `convertMinorExact` for any quote pair
  with the same ratio.
- `src/recurrence.property.test.ts`: occurrences stay inside the requested range, from the anchor up to the end
  month; the list is every month of the item's rhythm, with no gaps and no duplicates; the day of month is clamped
  to the last day of each month.
- `src/rule-versions.property.test.ts` (#80): random versions, overrides, active months and edits. Every accepted
  edit leaves every closed month unchanged; "from month M on" never changes a month before M; no override is left
  behind in an open month the new rule no longer schedules.

## Characterization tests

Legacy behaviour is pinned with characterization (golden-master) tests before it is changed (#3). Every known
deviation from the target behaviour is marked with a `// LEGACY:` comment linking the issue that changes it, and is
listed in [`packages/core/test/LEGACY.md`](../packages/core/test/LEGACY.md). When a
port deliberately changes behaviour, the characterization test diff must show it.

## Existing tests and follow-ups

What is tested and where in `packages/core` (no test counts: they conflict between PRs; each PR adds its own
line):
- `src/money.test.ts`: `MinorUnits` operations. It follows the business-behaviour and naming rules; the original
  tests are one-line act-and-assert checks, so explicit AAA sections are not needed there, and the newer ones
  (#2) use explicit AAA sections.
- `src/money-parse.test.ts` and `src/money-format.test.ts` (#2): parsing and native full-amount currency formatting,
  with explicit AAA sections; thousands with a single `,` or `.` in currencies without minor digits (#164). Formatting expectations use the current runtime's Intl output, accepting platform
  differences in symbols, spacing and grouping (#131); whole-unit rounding is checked separately.
- `src/money.property.test.ts` and `src/recurrence.property.test.ts` (#122): the properties listed above.
- `src/recurrence.test.ts` (#4): recurrence schedules – intervals, anchors, end month, day-of-month clamping,
  validation (`it.each` tables).
- `src/occurrence-overrides.test.ts` (#5): resolving occurrence overrides, their validation (including malformed
  stored data) and orphaned overrides.
- `src/rule-versions.test.ts` (#80): version lookup at boundaries (before the first version, year rollover, end
  month), anchors and day-of-month inside versions, every edit scope, scheduled changes kept or replaced, orphaned
  vs kept overrides and the closed-month rejections.
- `src/forecast.test.ts` and the `convertViaPln` block of `src/money.test.ts` (#6): rolling balances, payment filtering, warning boundaries,
  overrides and currency conversion; the forecast characterization compares rolling totals and warning severities
  with legacy at legacy thresholds.
- `src/month-closing.test.ts` (#84): close totals after overrides, payment status, balance carry-forward,
  foreign-currency snapshots and conversion, immutability and transition validation. Ported carry-forward and balance updates are compared
  with legacy in `test/month-closing.characterization.test.ts`.
- `src/settings.test.ts` (#76): `Settings` updates and validation, including malformed stored data and the
  `CurrencyCode` fields and `baseCurrency` rename (#126), with explicit AAA sections.
- `src/exchange-rates.test.ts` (#8): NBP validation/errors, recorded JPY conversion using existing money arithmetic,
  current-row replacement, offline lookup, business-day freshness boundaries (weekends, Monday morning, exactly 2 and
  3 business days, NBP and manual), the refresh gate (Warsaw dates around midnight and DST, older responses never replace newer rows), request
  cancellation on timeout (aborted signal, no timers left), manual tie precedence and partial refresh
  failures.
- `test/*.characterization.test.ts` (#3): legacy forecast, recurrence (including the comparison of the ported
  schedules with legacy, #4), occurrence overrides (legacy monthly totals compared with id-based overrides, #5),
  exchange rates, month closing and formatting (including the check that `formatMoney` matches the legacy
  `formatCurrency` away from rounding halves). They use explicit AAA sections and the frozen-clock exception
  from rule 5.

## E2E smoke tests (#15)

`apps/mobile/e2e/scaffold.e2e.ts` (added in #73) is the deterministic smoke suite: the app starts on `screen-home`,
each of the four other tabs opens its `screen-<name>` root, and the `overview-open-savings` action pushes
`screen-savings` inside Overview. Every step uses `getByTestId` locators only: no agent steps, no model provider, no
credentials and no translated-label selectors. Each test has explicit AAA sections. Expo UI on Android puts
`overview-open-savings` on a wrapper around the native button, so on Android the test taps the button inside that
test ID (`getByTestId("overview-open-savings").getByRole("button")`, selected with the `platform` fixture); iOS taps
the test ID directly. `apps/mobile/e2e/design-system.e2e.ts` (#119) opens the dev-only design system showcase
from Settings, checks its components and native controls in light and dark mode (`device.setAppearance`), checks
accessibility without translated text (the toggle has a non-empty accessible name and flips its checked state, the
budget progress bars are named and show their status text), scrolls to the type scale and the colour tokens with
`screen.scrollUntilVisible` (the mobile engine has no `scrollIntoView`) and takes the screenshots used as the visual
reference. The scaffold tab tests take one screenshot per tab (`settings` included).
`design-system-inputs.e2e.ts` (#182) checks the text, amount, secure, picker and date fields by test ID and
accessible name, the amount validation error appearing and clearing, the native picker menu and the native
calendar. `design-system-list.e2e.ts` opens the list example by deep
link (`device.openLink`; on iOS it confirms the "Open in …?" alert when the simulator shows it) and checks the paid
toggle (named on both platforms), the add button and the row swipe actions (#187): a swipe reveals the named
actions, "Delete" asks in the alert and removes the row, "Edit" opens the sheet. `design-system-overlays.e2e.ts`
(#187) opens the sheet, confirms the alert and picks a menu action, checking the last-action text. Rows are swiped
across the list at the row's height (`swipeRowLeft`), because on iOS the row's test ID is on the small status
button. The iOS system alert has no identifiers: XCUITest exposes it as a group named by its title, and `appAlert`
returns it with its last button as the confirm button. On Android, Compose puts a
`semantics` content description on a child node when the control also has text, so names are checked there
(`describedNode`). Shared steps are in `e2e/support/showcase.ts`.
Fallow lists the config and test glob as real runner entry points (it has no e2e plugin).

**Requirements:** Node from `.nvmrc` (the `e2e` package needs Node `^22.22.3 || >=24.8.0`), pnpm from
`packageManager`, Xcode with an iOS simulator runtime, the Android SDK with an emulator, and an Expo development build
installed on the dedicated devices ([mobile development](mobile-development.md#development-builds)).

**Run locally** (macOS dev machine; never in CI, see [ci.md](ci.md#native-builds-and-e2e-local)), from the repo root,
with Metro running on port 8073 (`pnpm --filter @budget-lens/mobile start`):

```sh
pnpm e2e:ios       # target ios, simulator E2E_IOS_SIMULATOR (default BudgetLens-iOS)
pnpm e2e:android   # target android, emulator E2E_ANDROID_AVD (default BudgetLens-Android)
E2E_IOS_SIMULATOR=My-Simulator pnpm e2e:ios
```

For Android, first forward Metro to the dedicated emulator only: `adb -s <BudgetLens-emulator-serial> reverse tcp:8073
tcp:8073`. The scripts set `E2E_TELEMETRY_DISABLED=1`. Output (report, `trace.md` per test, screenshots, iOS video)
goes to `apps/mobile/.e2e/<platform>/` and is ignored by Git; `app.screenshot()` files are under
`results/<test>/attempt-1/screenshots/`. Attach the screenshots to UI PRs (see the PR template).
Android screenshots are stabilized by agent-device (System UI demo mode with the clock set to 9:41 and
notification icons hidden), so captures of an unchanged screen can be identical; to show that a run used new test
code, attach that test's `trace.md` (run ID and steps) as well. If they show a clock other than 9:41, reset demo
mode on the dedicated emulator once (`adb -s <emulator-serial> shell am broadcast -a com.android.systemui.demo -e
command enter`, then the same with `exit`); see [evidence/15](evidence/15/README.md).

**Known capture quirks:** screenshots black out secure text fields (`SecureField`, password fields), including
ones on a screen underneath, which is why the list example is opened by deep link. On iOS the first gesture right
after `app.screenshot()` can be dropped by SwiftUI lists and scroll views, so tests take their captures after the
interactions they check.

### Large text (200%)

`apps/mobile/e2e/large-text.e2e.ts` is skipped unless `E2E_LARGE_TEXT=1`: the e2e API cannot change the system text
size, so set it on the dedicated devices first and reset it afterwards:

```sh
adb -s <BudgetLens-emulator-serial> shell settings put system font_scale 2.0   # reset: 1.0
xcrun simctl ui <BudgetLens-simulator> content_size accessibility-extra-large  # AX2, about 200%; reset: large
cd apps/mobile
E2E_LARGE_TEXT=1 pnpm exec e2e run --target android --output .e2e/android-large-text e2e/large-text.e2e.ts
E2E_LARGE_TEXT=1 pnpm exec e2e run --target ios --output .e2e/ios-large-text e2e/large-text.e2e.ts
```

It checks that every showcase control (overlay triggers included) is reachable by scrolling and captures the
components, the inputs, the list example and the whole showcase at that size. `openShowcase` scrolls the Settings
screen root directly: on iOS at 200%, viewport-level scrolling can stall within the long privacy disclosure before
reaching the showcase button. An additional bounded scroll clears the floating tab bar, which can cover the button
when it first becomes visible. The light and dark tests in
`design-system.e2e.ts` capture the whole showcase too: `captureShowcase` scrolls to each section in turn and takes one
screenshot per position (`showcase-<appearance>-<n>`). At 200% on iOS the engine's scroll can start on an embedded
SwiftUI control and move nothing, so `scrollShowcaseTo` falls back to slow drags along the page's left margin.

**`.e2e/cache`:** agent steps (`agent.act()` / `agent.assert()`) record their resolved actions in
`apps/mobile/.e2e/cache/`, one file per step key, so later runs replay them without calling a model. This directory is
the only part of `apps/mobile/.e2e/` that is not ignored, so the cache can be committed with the test that needs it.
The current suite has no agent steps, so there is no cache yet.

**Open decisions:**

- **Model provider** for agent steps and `e2e explore` is still open (#15). Options to compare when the first agent
  step is needed: a hosted API from a major provider (pay per token, data leaves the machine, best accuracy), a
  self-hosted or local model (no per-run cost and data stays local, weaker vision accuracy, needs local hardware), or
  an aggregator gateway (one key for many models, an extra third party). Replays from `.e2e/cache` need no model in
  any option. The API key stays in the local environment only ([conventions](conventions.md#secrets)).
- **CI plan:** e2e stays local per #166. If e2e is ever added to CI (#9), the plan is a macOS runner for iOS and an
  Android emulator (or `@e2e-dev/eas` EAS Simulators), replaying the committed `.e2e/cache` so no model is called,
  with `E2E_TELEMETRY_DISABLED=1`; `@e2e-dev/github` PR comments are optional.

See [mobile development](mobile-development.md) for build commands and the testID convention.
