# Testing guidelines

## Strategy

- **E2E tests are the main way the app is tested** (#15). They cover user flows on the app and use the open-source
  [e2e](https://github.com/tester-army/e2e) framework made by TesterArmy, configured with **our own models**; the hosted
  TesterArmy service is not used ([#15 e2e decisions
  comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252)). Which model provider to
  use is still an open decision in #15.
- **Unit tests are minimal:** only business logic in `packages/core`, written as Arrange-Act-Assert. The fewer, the
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
  Per #15 the first tests use `getByTestId` locators only, with no agent steps. The setup, `testID` convention,
  model configuration and CI plan are defined in #15.
  - **Telemetry must be disabled.** The `e2e` CLI sends anonymous usage telemetry by default
    ([e2e telemetry docs](https://e2e.tester.army/docs/telemetry)). Set `E2E_TELEMETRY_DISABLED=1` in every
    environment, local and CI, like `TURBO_TELEMETRY_DISABLED` in `.github/workflows/ci.yml` ([#15 e2e decisions
    comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252)).
  - The model provider API key comes from the local environment on the Mac Studio (later GitHub Actions secrets if
    CI needs it) and never appears on GitHub ([#15 e2e decisions
    comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252); see
    [conventions.md](conventions.md#secrets)).
  - UI PRs include e2e evidence with **screenshots or a video**, from an `e2e` test run or `e2e explore` on a
    development build.
  - Only the dedicated **`BudgetLens-*` simulators/emulators** are used, never personal or shared devices.
  - Metro runs on the repo's **fixed port**; the number is not chosen yet and will be defined with `apps/mobile`
    in #15.

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
  const activeMonth = { month: "2026-12", openingBalance: toMinorUnits(100_000) };

  // Act
  const { next } = closeMonth(activeMonth, { closingBalance: toMinorUnits(120_000), ...input });

  // Assert
  expect(next).toMatchObject({ month: "2027-01", openingBalance: 120_000 });
});
```

(Illustrative only – `closeMonth` is planned in #7.)

## Property-based tests

Use [fast-check](https://fast-check.dev/) (`fc.assert(fc.property(...))` inside a Vitest `it`) for business
invariants that must hold for every input, not just a few examples: money arithmetic and parse/format round-trips
(#2), recurrence (occurrence counts, interval and anchor invariants, end dates, day-of-month clamping, #4). The same
rules apply: few properties, business-behaviour names, AAA inside the property. Keep the generated ranges realistic
(for example amounts whose sums stay safe integers) and do not fix a seed; on failure fast-check prints the seed and
the shrunk counterexample to reproduce it.

**Deferred from #18 (not tracked by an issue yet; a follow-up issue will be opened and linked here).** Only the
money arithmetic properties exist today (`src/money.property.test.ts`). Still to add:
- money parse/format round-trip (`parseMoney(formatMoney(x))`) and `multiplyByRate` rounding (half away from zero),
  once the parsing and formatting code from #2 (PR #117) is on `main`;
- recurrence properties (occurrence counts, interval and anchor invariants, end dates, day-of-month clamping),
  together with #4.

## Characterization tests

Legacy behaviour is pinned with characterization (golden-master) tests before it is changed (#3). Every known
deviation from the target behaviour is marked with a `// LEGACY:` comment linking the issue that changes it, and is
listed in [`packages/core/test/LEGACY.md`](../packages/core/test/LEGACY.md). When a
port deliberately changes behaviour, the characterization test diff must show it.

## Existing tests and follow-ups

`packages/core` has 58 tests:
- `src/money.test.ts` (19 tests) follows the business-behaviour and naming rules and is left as-is. Its tests are
  one-line act-and-assert checks, so explicit AAA sections are not needed there.
- `src/money.property.test.ts` (2 property-based tests, see below).
- 37 characterization tests in `packages/core/test/` (#3): forecast 11, recurrence 9, exchange rates 8, month
  closing 5, formatting 4. They use explicit AAA sections and the frozen-clock exception from rule 5.

Follow-ups:
- When `money.test.ts` grows multi-step cases (e.g. parsing and formatting in #2), split them into explicit AAA
  sections.
