import "@formatjs/intl-pluralrules/polyfill-force.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-pluralrules/locale-data/pl.js";
import { describe, expect, it } from "vitest";
import { createI18n } from "./create-i18n";
import { resolveLanguage } from "./language";

// Fixture keys are not part of the typed app resources.
type LooseT = (key: string, options?: Record<string, string | number>) => string;

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

describe("the monthName formatter", () => {
  /** A key rendered from the real resources, with a `YearMonth` or a month number in it. */
  const render = (language: "en" | "pl", key: string, month: string | number): string => {
    const t = createI18n(language).t as unknown as LooseT;
    return t(key, { ns: "items", month });
  };

  it("renders the month keys of the items list in English", () => {
    // Arrange: January, February and October of 2027, and their month numbers for the yearly key.
    const months = ["2027-01", "2027-02", "2027-10"] as const;

    // Act
    const lines = months.flatMap((month) => [
      render("en", "list.changeFrom", month),
      render("en", "summary.from", month),
      render("en", "summary.until", month),
      render("en", "summary.ended", month),
      render("en", "summary.oneTime", month),
      render("en", "summary.yearly", Number(month.slice(5, 7))),
    ]);

    // Assert
    expect(lines).toEqual([
      "Change from January 2027",
      "from Jan 2027",
      "until Jan 2027",
      "Ended Jan 2027",
      "One-time · Jan 2027",
      "Yearly · January",
      "Change from February 2027",
      "from Feb 2027",
      "until Feb 2027",
      "Ended Feb 2027",
      "One-time · Feb 2027",
      "Yearly · February",
      "Change from October 2027",
      "from Oct 2027",
      "until Oct 2027",
      "Ended Oct 2027",
      "One-time · Oct 2027",
      "Yearly · October",
    ]);
  });

  it("declines the Polish months by the case each key asks for", () => {
    // Arrange: February is the odd one out – lutego, lutym, lutym.
    const months = ["2027-01", "2027-02", "2027-10"] as const;

    // Act
    const lines = months.flatMap((month) => [
      render("pl", "list.changeFrom", month),
      render("pl", "summary.from", month),
      render("pl", "summary.until", month),
      render("pl", "summary.ended", month),
      render("pl", "summary.oneTime", month),
      render("pl", "summary.yearly", Number(month.slice(5, 7))),
    ]);

    // Assert
    expect(lines).toEqual([
      "Zmiana od stycznia 2027",
      "od stycznia 2027",
      "do stycznia 2027",
      "Zakończona w styczniu 2027",
      "Jednorazowo · sty 2027",
      "Co roku · styczeń",
      "Zmiana od lutego 2027",
      "od lutego 2027",
      "do lutego 2027",
      "Zakończona w lutym 2027",
      "Jednorazowo · lut 2027",
      "Co roku · luty",
      "Zmiana od października 2027",
      "od października 2027",
      "do października 2027",
      "Zakończona w październiku 2027",
      "Jednorazowo · paź 2027",
      "Co roku · październik",
    ]);
  });

  it("declines the month keys of the item form by the case each one asks for", () => {
    // Arrange: the four cases the sheet needs – a standalone month, one after "przed" (instrumental), one
    // after "od/odnośnik" (genitive), and one that starts a sentence (capitalised nominative).
    const months = ["2027-01", "2027-02", "2027-10"] as const;
    const keys = [
      "form.thisMonth",
      "form.appliesFromHint",
      "notice.scheduledKept.title",
      "form.oneTimeHint",
      "errors.monthClosed.title",
    ] as const;

    // Act
    const lines = months.flatMap((month) => keys.map((key) => render("pl", key, month)));

    // Assert
    expect(lines).toEqual([
      "styczeń 2027 (bieżący miesiąc)",
      "Miesiące przed styczniem 2027 zachowają obecną kwotę i harmonogram. Zamknięte miesiące nigdy się nie zmieniają.",
      "Od stycznia 2027 jest już zaplanowana zmiana",
      "Pozycja jednorazowa. Zmiany dotyczą tylko stycznia 2027.",
      "Styczeń 2027 został zamknięty",
      "luty 2027 (bieżący miesiąc)",
      "Miesiące przed lutym 2027 zachowają obecną kwotę i harmonogram. Zamknięte miesiące nigdy się nie zmieniają.",
      "Od lutego 2027 jest już zaplanowana zmiana",
      "Pozycja jednorazowa. Zmiany dotyczą tylko lutego 2027.",
      "Luty 2027 został zamknięty",
      "październik 2027 (bieżący miesiąc)",
      "Miesiące przed październikiem 2027 zachowają obecną kwotę i harmonogram. Zamknięte miesiące nigdy się nie zmieniają.",
      "Od października 2027 jest już zaplanowana zmiana",
      "Pozycja jednorazowa. Zmiany dotyczą tylko października 2027.",
      "Październik 2027 został zamknięty",
    ]);
  });

  it("names the month in the item form keys in English", () => {
    // Arrange
    const months = ["2027-01", "2027-02", "2027-10"] as const;
    const keys = [
      "form.thisMonth",
      "form.appliesFromHint",
      "notice.scheduledReplaced.title",
      "form.oneTimeClosed",
      "errors.monthClosed.title",
    ] as const;

    // Act
    const lines = months.flatMap((month) => keys.map((key) => render("en", key, month)));

    // Assert
    expect(lines).toEqual([
      "January 2027 (this month)",
      "Months before January 2027 keep their current amount and schedule. Closed months never change.",
      "The change scheduled from January 2027 will be replaced.",
      "January 2027 is closed, so this item can't be changed. Closed months keep their history.",
      "January 2027 has been closed",
      "February 2027 (this month)",
      "Months before February 2027 keep their current amount and schedule. Closed months never change.",
      "The change scheduled from February 2027 will be replaced.",
      "February 2027 is closed, so this item can't be changed. Closed months keep their history.",
      "February 2027 has been closed",
      "October 2027 (this month)",
      "Months before October 2027 keep their current amount and schedule. Closed months never change.",
      "The change scheduled from October 2027 will be replaced.",
      "October 2027 is closed, so this item can't be changed. Closed months keep their history.",
      "October 2027 has been closed",
    ]);
  });

  it("capitalises a month that starts a sentence", () => {
    // Arrange: a fixture key – the copy that needs it belongs to #82.
    const renderCapitalised = (language: "en" | "pl"): string =>
      (createI18n(language).t as unknown as LooseT)("{{month, monthName(capitalize: true)}}", {
        month: "2026-10",
      });

    // Act
    const lines = [renderCapitalised("pl"), renderCapitalised("en")];

    // Assert: Polish month names are lowercase and get their capital only here; English is unchanged.
    expect(lines).toEqual(["Październik 2026", "October 2026"]);
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
