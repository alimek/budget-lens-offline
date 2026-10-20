import { describe, expect, it } from "vitest";
import { shouldStackRows } from "./large-text";

describe("shouldStackRows", () => {
  it("keeps label and amount on one line up to the largest standard text size", () => {
    expect(shouldStackRows(1)).toBe(false);
    expect(shouldStackRows(1.35)).toBe(false);
  });

  it("stacks them at accessibility sizes and 200% font scale", () => {
    expect(shouldStackRows(1.5)).toBe(true);
    expect(shouldStackRows(2)).toBe(true);
  });
});
