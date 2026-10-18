# 0004 – Testing tools

Status: Accepted (#1, #15)

**Decision.** Unit tests in `packages/core` use **Vitest**. End-to-end tests of the Expo app use **TesterArmy e2e**
(`e2e` + `@e2e-dev/mobile`) on iOS simulators and Android emulators, set up in #15; selectors use `testID`.

**Consequences.** Guidelines are in [../testing.md](../testing.md). UI PRs must include e2e evidence from a
development build.
