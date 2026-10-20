import { toMinorUnits } from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import { budgetProgress } from "./progress";

describe("budgetProgress", () => {
  it.each([
    [0, 10_000, { fraction: 0, over: false }],
    [2_500, 10_000, { fraction: 0.25, over: false }],
    [10_000, 10_000, { fraction: 1, over: false }],
    [12_000, 10_000, { fraction: 1, over: true }],
    [-500, 10_000, { fraction: 0, over: false }],
    [0, 0, { fraction: 0, over: false }],
    [100, 0, { fraction: 1, over: true }],
  ])("spent %i of %i grosze gives %o", (spent, budget, expected) => {
    // Arrange
    const spentMinor = toMinorUnits(spent);
    const budgetMinor = toMinorUnits(budget);

    // Act
    const progress = budgetProgress(spentMinor, budgetMinor);

    // Assert
    expect(progress).toEqual(expected);
  });
});
