import { describe, expect, it } from "vitest";
import { shouldStackRows } from "./large-text";

describe("shouldStackRows", () => {
  it.each([
    [1, false],
    [1.35, false],
  ])("keeps label and amount on one line at font scale %d", (fontScale, expected) => {
    // Act
    const stacked = shouldStackRows(fontScale);

    // Assert
    expect(stacked).toBe(expected);
  });

  it.each([
    [1.5, true],
    [2, true],
  ])("stacks label and amount at font scale %d", (fontScale, expected) => {
    // Act
    const stacked = shouldStackRows(fontScale);

    // Assert
    expect(stacked).toBe(expected);
  });
});
