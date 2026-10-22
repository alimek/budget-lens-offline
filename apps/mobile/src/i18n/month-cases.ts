// The Polish month forms `Intl` cannot produce (#63, decision 5). After a preposition Polish declines the month
// name, while `Intl` gives either the nominative ("styczeń 2027") or a genitive only inside a full date with a day
// in it, and has no instrumental or locative at all. The table below is linguistic data, not translatable copy, so
// it stays out of `i18n:extract` and can never fall back to English in the middle of a word. The nominative comes
// from `Intl` in both languages, and English needs no table at all: it uses one form everywhere.
export type MonthCase = "nominative" | "genitive" | "instrumental" | "locative";

/** The twelve forms of one grammatical case; index 0 is January. */
export type MonthForms = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/** The Polish cases a month name takes in app copy ("od stycznia", "przed styczniem", "w styczniu"). */
export const MONTH_CASES: Readonly<Record<Exclude<MonthCase, "nominative">, MonthForms>> = {
  genitive: [
    "stycznia",
    "lutego",
    "marca",
    "kwietnia",
    "maja",
    "czerwca",
    "lipca",
    "sierpnia",
    "września",
    "października",
    "listopada",
    "grudnia",
  ],
  instrumental: [
    "styczniem",
    "lutym",
    "marcem",
    "kwietniem",
    "majem",
    "czerwcem",
    "lipcem",
    "sierpniem",
    "wrześniem",
    "październikiem",
    "listopadem",
    "grudniem",
  ],
  locative: [
    "styczniu",
    "lutym",
    "marcu",
    "kwietniu",
    "maju",
    "czerwcu",
    "lipcu",
    "sierpniu",
    "wrześniu",
    "październiku",
    "listopadzie",
    "grudniu",
  ],
};
