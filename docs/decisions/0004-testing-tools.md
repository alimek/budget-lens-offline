# 0004 – Testing strategy and tools

Status: Accepted (#1, #15; owner decision of 2026-10-18 on the testing strategy)

**Decision.**
- **E2E tests with TesterArmy e2e** (`e2e` + `@e2e-dev/mobile`) on iOS simulators and Android emulators are the main
  way the app is tested. Setup, `testID` conventions and the CI plan are defined in #15.
- **Unit tests are minimal:** Vitest in `packages/core`, business logic only, Arrange-Act-Assert.
- **No percentage coverage thresholds** in any configuration or CI job; coverage is reported for information only.

**Consequences.** Guidelines are in [../testing.md](../testing.md). UI PRs must include e2e evidence (screenshots or
video) from a development build.
