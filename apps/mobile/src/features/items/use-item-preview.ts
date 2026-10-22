// The plain-language preview of the item sheet (#63, #82): the recurrence summary of the rule the form describes,
// the next dates that rule resolves to, and the no-rate line of a foreign amount. The dates come from the same
// `occurrencesInRange` the engine answers with, so the sentence can never disagree with what gets scheduled.
import type { Language, YearMonth } from "@budget-lens/core";
import { useTranslation } from "react-i18next";
import { type CalendarDate, formatCalendarDate } from "@/ui/calendar-date";
import { useLanguage } from "@/ui/use-language";
import {
  formAmount,
  formPreview,
  formSchedule,
  type ItemFormState,
  occurrenceDay,
} from "./item-form";
import { joinSummary, summarizeVersion } from "./recurrence-summary";

/** The three muted lines under the fields, already translated. */
export interface ItemPreview {
  /** The summary sentence of the rule the form describes ("Monthly · on the 15th · from Oct 2026"). */
  readonly summary: string;
  /** "Next: Nov 15, 2026, Dec 15, 2026, Jan 15, 2027" (#63). */
  readonly next: string;
  /** The no-rate line of #61: the preview says nothing about a base value until #92 adds rates. */
  readonly noRate: string;
}

/**
 * The preview of what the form currently describes, or none while it does not describe a schedulable rule: a
 * schedule the engine rejects has no preview at all, and neither has an amount it cannot parse.
 */
export function usePreview(form: ItemFormState, activeMonth: YearMonth): ItemPreview | undefined {
  const { t } = useTranslation("items");
  const { t: tShared } = useTranslation();
  const lang = useLanguage();
  const amount = formAmount(form);
  const schedule = formSchedule(form);
  if (amount === undefined || schedule === undefined) return undefined;
  const parts = summarizeVersion({ effectiveFrom: form.firstMonth, amount, schedule }, activeMonth);
  return {
    summary: joinSummary(parts, (key, options) => t(key, { ...options })),
    next: t("form.preview.next", { dates: previewDates(form, activeMonth, lang) }),
    noRate: tShared("amountInput.hint.noRate"),
  };
}

/** The next occurrences of the form's schedule as calendar dates in the app language (#63). */
function previewDates(form: ItemFormState, activeMonth: YearMonth, lang: Language): string {
  return formPreview(form, activeMonth)
    .map((occurrence) => {
      const { month, dayOfMonth } = occurrenceDay(occurrence);
      return formatCalendarDate(
        `${month}-${String(dayOfMonth).padStart(2, "0")}` as CalendarDate,
        lang,
      );
    })
    .join(", ");
}
