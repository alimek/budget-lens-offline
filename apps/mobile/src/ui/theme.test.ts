import { describe, expect, it } from "vitest";
import css from "../../global.css?raw";
import { type ColorScheme, colors, radii, resolveColorScheme } from "./theme";

function cssColors(scheme: ColorScheme): Record<string, string> {
  const block = new RegExp(`@variant ${scheme} \\{([^}]*)\\}`).exec(css)?.[1] ?? "";
  const entries = [...block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)].map(
    ([, name, value]) => [name, value?.toUpperCase()],
  );
  return Object.fromEntries(entries);
}

function upper(values: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [name, value.toUpperCase()]),
  );
}

describe("design tokens", () => {
  it.each(["light", "dark"] as const)(
    "keeps the %s colours of global.css and theme.ts in sync",
    (scheme) => {
      // Arrange
      const expected = upper(colors[scheme]);

      // Act
      const actual = cssColors(scheme);

      // Assert
      expect(actual).toEqual(expected);
    },
  );

  it("keeps the radii of global.css and theme.ts in sync", () => {
    // Arrange
    const expected = { sm: radii.sm, md: radii.md, lg: radii.lg };

    // Act
    const actual = Object.fromEntries(
      [...css.matchAll(/--radius-(sm|md|lg):\s*(\d+)px;/g)].map(([, name, value]) => [
        name,
        Number(value),
      ]),
    );

    // Assert
    expect(actual).toEqual(expected);
  });

  it("defines no font-family token, so the platform system font is used", () => {
    // Arrange
    const fontToken = /--font-[a-z-]+\s*:/;

    // Act
    const hasFontToken = fontToken.test(css);

    // Assert
    expect(hasFontToken).toBe(false);
  });

  it("uses the Indigo primary from #58", () => {
    // Arrange
    const { light, dark } = colors;

    // Act
    const primaries = [
      light.primary,
      dark.primary,
      light["primary-foreground"],
      dark["primary-foreground"],
    ];

    // Assert
    expect(primaries).toEqual(["#3F4BA8", "#9AA3F5", "#FFFFFF", "#10154A"]);
  });

  it.each([
    ["dark", "dark"],
    ["light", "light"],
    [null, "light"],
    ["unspecified", "light"],
  ])("resolves the system scheme %s to %s tokens", (scheme, expected) => {
    // Arrange / Act
    const resolved = resolveColorScheme(scheme);

    // Assert
    expect(resolved).toBe(expected);
  });
});
