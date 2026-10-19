# 0004 – Testing strategy and tools

Status: Accepted (#1, #15; e2e framework, models, telemetry and secrets: [#15 e2e decisions
comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252); testing strategy and UI
verification: [#1 decisions comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427))

**Decision.**
- **E2E tests with the open-source [e2e](https://github.com/tester-army/e2e) framework** made by TesterArmy
  (`e2e` + `@e2e-dev/mobile`) on iOS simulators and Android emulators are the main way the app is tested. The
  framework is configured with our own models; the hosted TesterArmy service is not used. Which model provider to
  use is still an open decision in #15. Telemetry is disabled with `E2E_TELEMETRY_DISABLED=1` in every environment.
  Setup and `testID` conventions are defined in #15. E2E runs locally on the Mac Studio on `BudgetLens-*`
  simulators, not in CI (#166, [../ci.md](../ci.md#native-builds-and-e2e-local)).
- **Unit tests are minimal:** Vitest in `packages/core`, business logic only, Arrange-Act-Assert.
- **Property-based tests** with fast-check for business invariants of money and recurrence (#18).
- **No percentage coverage thresholds** in any configuration or CI job; coverage is reported for information only.

**Consequences.** Guidelines are in [../testing.md](../testing.md). UI PRs must include e2e evidence:
screenshots (iOS + Android, `BudgetLens-*` simulator/emulator named; a video is also fine) from a TesterArmy `e2e`
run or `e2e explore` on a local development build on the Mac Studio. A manual screenshot from a development build
alone is not enough. Model API keys are secrets: they come from the local environment (later GitHub Actions secrets
if CI needs them) and never appear on GitHub – see [../conventions.md](../conventions.md#secrets).
