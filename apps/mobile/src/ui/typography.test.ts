import { describe, expect, it } from "vitest";
import { typeStyle } from "./typography";

describe("typeStyle", () => {
  it.each([
    ["ios", "body", { fontSize: 17, lineHeight: 22, fontWeight: "400" }],
    ["android", "body", { fontSize: 16, lineHeight: 24, fontWeight: "400" }],
    ["ios", "display", { fontSize: 34, lineHeight: 41, fontWeight: "700" }],
    ["android", "title-3", { fontSize: 16, lineHeight: 24, fontWeight: "500" }],
  ] as const)("maps %s %s to the platform text style", (platform, variant, expected) => {
    // Arrange / Act
    const style = typeStyle(variant, platform);

    // Assert
    expect(style).toEqual(expected);
  });

  it.each(["ios", "android"])("uses tabular figures for amounts on %s", (platform) => {
    // Arrange / Act
    const styles = [typeStyle("amount", platform), typeStyle("amount-lg", platform)];

    // Assert
    expect(styles.map((style) => style.fontVariant)).toEqual([["tabular-nums"], ["tabular-nums"]]);
  });

  it("uppercases section labels on iOS only", () => {
    // Arrange / Act
    const ios = typeStyle("section-label", "ios");
    const android = typeStyle("section-label", "android");

    // Assert
    expect([ios.textTransform, android.textTransform]).toEqual(["uppercase", undefined]);
  });

  it("never sets a font family", () => {
    // Arrange / Act
    const style = typeStyle("headline", "ios");

    // Assert
    expect(style).not.toHaveProperty("fontFamily");
  });
});
