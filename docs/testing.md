# Testing guidelines

## Tools

- **Unit tests:** Vitest in `packages/core` (`src/**/*.test.ts`, next to the code). Run with `pnpm test`.
- **Coverage:** `pnpm --filter @budget-lens/core test:coverage`; CI shows a coverage summary and uploads the report.
- **E2E (app):** TesterArmy `e2e` on iOS simulators and Android emulators, using `testID` selectors (#15). UI PRs
  include e2e evidence (test run or `e2e explore` output) from a development build.

## Rules

1. **Arrange-Act-Assert.** Every test has three clearly separated sections: set up the inputs, perform one action,
   check the outcome. Separate them with blank lines (and `// Arrange`, `// Act`, `// Assert` comments when the test
   is longer than a few lines). One action per test.
2. **Test business cases and logic only.** Do not write tests for trivial code (plain getters, re-exports, type-only
   modules), wiring (that a module exports something, that a provider renders) or framework/library behaviour
   (Drizzle, Expo, React, Vitest itself).
3. **No 100% coverage goal and no coverage thresholds in CI.** Aim for meaningful coverage of the domain logic:
   edge cases, boundaries, invalid input, regressions.
4. **Test names describe the business behaviour**, not the implementation: `"sums amounts without rounding errors"`,
   not `"calls reduce"`. Group with `describe` per function or behaviour.
5. **Deterministic.** Domain code takes the current month/time as an argument; tests pass fixed values instead of
   mocking the clock. Inject `fetch` and storage interfaces instead of hitting the network.
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

## Characterization tests

Legacy behaviour is pinned with characterization (golden-master) tests before it is changed (#3). Every known
deviation from the target behaviour is marked with a `// LEGACY:` comment linking the issue that changes it. When a
port deliberately changes behaviour, the characterization test diff must show it.

## Existing tests and follow-ups

`packages/core/src/money.test.ts` (19 tests) follows the business-behaviour and naming rules and is left as-is.
Its tests are one-line act-and-assert checks, so explicit AAA sections are not needed there.

Follow-ups:
- When `money.test.ts` grows multi-step cases (e.g. parsing and formatting in #2), split them into explicit AAA
  sections.
- Apply these rules to the characterization tests from #3 when they land.
