import { describe, expect, it } from "vitest";
import css from "../../../global.css?raw";
import { type ColorScheme, colors, NAV_THEME, radii } from "./theme";

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

  it.each(["light", "dark"] as const)(
    "builds the %s navigation theme from the tokens",
    (scheme) => {
      // Arrange
      const tokens = colors[scheme];

      // Act
      const navigation = NAV_THEME[scheme];

      // Assert
      expect(navigation).toEqual({
        primary: tokens.primary,
        background: tokens.background,
        card: tokens.card,
        text: tokens.foreground,
        border: tokens.border,
        notification: tokens.destructive,
      });
    },
  );
});
