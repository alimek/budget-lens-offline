import { toMinorUnits } from "@budget-lens/core";
import { describe, expect, it } from "vitest";
import { budgetProgress } from "./progress";

describe("budgetProgress", () => {
  it.each([
    [0, 10_000, { fraction: 0, over: false, percent: 0 }],
    [2_500, 10_000, { fraction: 0.25, over: false, percent: 25 }],
    [10_000, 10_000, { fraction: 1, over: false, percent: 100 }],
    [12_000, 10_000, { fraction: 1, over: true, percent: 120 }],
    [3_333, 10_000, { fraction: 0.3333, over: false, percent: 33 }],
    [-500, 10_000, { fraction: 0, over: false, percent: 0 }],
    [0, 0, { fraction: 0, over: false, percent: 0 }],
    [100, 0, { fraction: 1, over: true, percent: 100 }],
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
