// The `monthName` i18next formatter (#63, decision 5), registered once in `createI18n()` so every namespace can
// use it: `od {{month, monthName(case: genitive)}}`. Translators pick the grammatical case in the string itself,
// so no caller has to know which language needs which one. The value is a `YearMonth` ("2027-02"), which renders
// month and year, or a month number 1-12 (a yearly anchor), which renders the month alone. A `YearMonth` is a
// calendar month and not an instant, so it is read as the first of that month in UTC: no device time zone can move
// a month boundary.
import { MONTH_CASES, type MonthCase } from "./month-cases";

/** Which month of the year it is; also the index of the case table. */
type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const inflectedCases: readonly Exclude<MonthCase, "nominative">[] = [
  "genitive",
  "instrumental",
  "locative",
];

function inflectedCase(value: unknown): Exclude<MonthCase, "nominative"> | undefined {
  return inflectedCases.find((name) => name === value);
}

function monthNumber(value: unknown): MonthNumber | undefined {
  const month = typeof value === "number" ? value : Number(typeof value === "string" ? value : "");
  return Number.isInteger(month) && month >= 1 && month <= 12 ? (month as MonthNumber) : undefined;
}

/** The month and optional year behind a `monthName` placeholder, or nothing when it is not a month at all. */
function parseMonth(value: unknown): { month: MonthNumber; year: number | undefined } | undefined {
  const text = typeof value === "number" ? String(value) : value;
  if (typeof text !== "string") {
    return undefined;
  }
  const yearMonth = /^(\d{4})-(\d{2})$/.exec(text);
  if (yearMonth !== null) {
    const month = monthNumber(Number(yearMonth[2]));
    return month === undefined ? undefined : { month, year: Number(yearMonth[1]) };
  }
  const month = monthNumber(text);
  return month === undefined ? undefined : { month, year: undefined };
}

/**
 * The `monthName` formatter: `case` is `nominative` (default), `genitive`, `instrumental` or `locative`, and
 * `style` is `long` (default) or `short`. `capitalize` (`true`, default off) then upper-cases the first letter of
 * the chosen form, for a sentence that starts with a month: Polish month names are lowercase ("październik"),
 * English ones are already upper-cased. Only a long Polish non-nominative month comes from the table – an
 * abbreviation does not inflect, so `short` is `Intl` in every language. A value that is not a month is rendered
 * unchanged rather than turned into a wrong date.
 */
export function formatMonthName(
  value: unknown,
  lng: string | undefined,
  options: Record<string, unknown> = {},
): string {
  const parsed = parseMonth(value);
  if (parsed === undefined) {
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  }
  const { month, year } = parsed;
  const language = lng?.split("-")[0]?.toLowerCase() ?? "en";
  const style = options["style"] === "short" ? "short" : "long";
  const inflected =
    style === "long" && language === "pl" ? inflectedCase(options["case"]) : undefined;
  if (inflected !== undefined) {
    // The table holds all twelve months, and `parseMonth` only returns 1-12, so the form is always there.
    const name = MONTH_CASES[inflected][month - 1] as string;
    return capitalize(year === undefined ? name : `${name} ${year}`, lng, options);
  }
  return capitalize(
    new Intl.DateTimeFormat(language, {
      month: style,
      ...(year === undefined ? {} : { year: "numeric" as const }),
      timeZone: "UTC",
    }).format(Date.UTC(year ?? 1970, month - 1, 1)),
    lng,
    options,
  );
}

/** `{{month, monthName(capitalize: true)}}` – i18next passes the option as text, so both spellings count. */
function capitalize(
  text: string,
  lng: string | undefined,
  options: Record<string, unknown>,
): string {
  if (options["capitalize"] !== true && options["capitalize"] !== "true") {
    return text;
  }
  return text.charAt(0).toLocaleUpperCase(lng) + text.slice(1);
}
