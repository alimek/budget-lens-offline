import "@formatjs/intl-pluralrules/polyfill-force.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-pluralrules/locale-data/pl.js";
import { describe, expect, it } from "vitest";
import { createI18n } from "./create-i18n";
import { resolveLanguage } from "./language";

// Fixture keys are not part of the typed app resources.
type LooseT = (key: string, options?: { count: number }) => string;

describe("createI18n", () => {
  it("falls back to English for a key missing in Polish", () => {
    // Arrange
    const i18n = createI18n("pl", {
      en: { translation: { greeting: "Hello", farewell: "Bye" } },
      pl: { translation: { farewell: "" } },
    });
    const t = i18n.t as unknown as LooseT;

    // Act
    const missing = t("greeting");
    const emptyPlaceholder = t("farewell");

    // Assert
    expect(missing).toBe("Hello");
    expect(emptyPlaceholder).toBe("Bye");
  });

  it("picks the Polish JSON v4 plural forms one, few and many", () => {
    // Arrange
    const i18n = createI18n("pl", {
      en: { translation: { items_one: "{{count}} item", items_other: "{{count}} items" } },
      pl: {
        translation: {
          items_one: "{{count}} pozycja",
          items_few: "{{count}} pozycje",
          items_many: "{{count}} pozycji",
          items_other: "{{count}} pozycji",
        },
      },
    });
    const t = i18n.t as unknown as LooseT;

    // Act
    const forms = [1, 2, 5, 22, 25].map((count) => t("items", { count }));

    // Assert
    expect(forms).toEqual(["1 pozycja", "2 pozycje", "5 pozycji", "22 pozycje", "25 pozycji"]);
  });
});

describe("resolveLanguage", () => {
  it("follows a supported device language, falls back to English otherwise, and lets an override win", () => {
    // Arrange
    const cases = [
      { preference: "system", device: "pl" },
      { preference: "system", device: "de" },
      { preference: "system", device: null },
      { preference: "en", device: "pl" },
      { preference: "pl", device: "de" },
    ] as const;

    // Act
    const languages = cases.map(({ preference, device }) => resolveLanguage(preference, device));

    // Assert
    expect(languages).toEqual(["pl", "en", "en", "en", "pl"]);
  });
});
