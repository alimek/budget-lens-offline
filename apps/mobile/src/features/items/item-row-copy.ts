// The words of one Items list row (#112): the row model of `item-rows.ts` turned into the texts a row shows.
// Nothing is concatenated here – every part is a full i18n phrase with its options, months reach the
// `monthName` formatter raw and the amount comes from `ui/amount.ts`, so a language can order and decline them
// as it likes (docs/i18n.md). Keys of the `items` namespace.
import type { Language } from "@budget-lens/core";
import { type FormattedAmount, formatAmount } from "../../ui/amount";
import type { MenuAction } from "../../ui/native/types";
import type { ItemRow } from "./item-rows";
import { joinSummary, type SummaryTextKey } from "./recurrence-summary";

/** The keys of this file; the screen hands `itemRowCopy` a lookup over exactly these. */
type ItemTextKey =
  | "actions.archive"
  | "list.changeFrom"
  | "list.noRate"
  | "a11y.row"
  | "a11y.rowChange"
  | "a11y.amountNoRate"
  | "a11y.kindIncome"
  | "a11y.kindExpense";

/** A translation lookup: `useTranslation().t` wrapped over the keys of the list. */
export type ItemTranslate = (
  key: ItemTextKey | SummaryTextKey,
  options?: Record<string, string | number | boolean>,
) => string;

/** Everything a row renders, translated, so no component has to know how the texts are built. */
export interface ItemRowCopy {
  /** The signed amount and its colour role, from `ui/amount.ts`. */
  readonly amount: FormattedAmount;
  /** The recurrence summary under the name. */
  readonly meta: string;
  /** The "Change from" badge; only a scheduled change gets one. */
  readonly badge: string | undefined;
  /** The note under the amount of a foreign item; there is no rate to show yet (#92). */
  readonly amountNote: string | undefined;
  /** The accessible name of the whole row: the parts in reading order, as one sentence. */
  readonly accessibilityLabel: string;
}

/** The texts of one row, translated with `t` and formatted for `lang`. */
export function itemRowCopy(row: ItemRow, lang: Language, t: ItemTranslate): ItemRowCopy {
  const amount = formatAmount(row.amount, { lang, currency: row.currency, sign: "always" });
  const summary = joinSummary(row.summary, (key, options) => t(key, options));
  const change =
    row.changeFrom === undefined ? undefined : t("list.changeFrom", { month: row.changeFrom });
  const note = row.foreign ? t("list.noRate") : undefined;
  // A row that is one accessibility element reads its parts in order; the note under a foreign amount is one of
  // them, because nothing else on the row can reach it.
  const spoken =
    note === undefined
      ? amount.text
      : t("a11y.amountNoRate", {
          amount: amount.text,
          note,
        });
  const label = t(change === undefined ? "a11y.row" : "a11y.rowChange", {
    name: row.name,
    kind: t(row.itemType === "income" ? "a11y.kindIncome" : "a11y.kindExpense"),
    amount: spoken,
    summary,
    ...(change === undefined ? {} : { change }),
  });
  return { amount, meta: summary, badge: change, amountNote: note, accessibilityLabel: label };
}

/** The row actions of the Items list: archive only. #82 adds "edit" to this list; nothing else changes. */
export function itemRowActions(t: ItemTranslate): readonly MenuAction<string>[] {
  return [{ key: "archive", label: t("actions.archive"), destructive: true }];
}
