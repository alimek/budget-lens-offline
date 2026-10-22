// The parts of the item sheet (#82) that are decisions and not rendering: what its four live reads mean, which
// notice of #64 the live dry run calls for, and which copy each state shows. Pure, so the whole sheet is testable
// without React: the components only render what these functions return.
import {
  type CurrencyCode,
  DEFAULT_SETTINGS,
  type Language,
  type OccurrenceOverride,
  type RuleEditError,
  type RuleEditPlan,
  type Settings,
  type YearMonth,
} from "@budget-lens/core";
import type { ItemsRead, OccurrenceErrorCode, StoredItem } from "@budget-lens/db";
import type { ActiveMonth } from "@/db/use-active-month";
import type { LiveRead } from "@/db/use-live-read";

/** The state of one of the sheet's reads. */
export type ReadStatus = "loading" | "ready" | "error";

/** The reads the sheet needs before it can show a form: the month, the settings, the items and the overrides. */
export interface SheetReads {
  readonly month: ActiveMonth;
  readonly settings: LiveRead<Settings>;
  readonly items: LiveRead<ItemsRead>;
  readonly overrides: LiveRead<{ readonly overrides: readonly OccurrenceOverride[] }>;
  /** The item being edited; `undefined` when the sheet creates one. */
  readonly itemId: string | undefined;
  /** The app language: changing it rewrites the texts and the typed amount. */
  readonly lang: Language;
}

/** What the sheet shows: a read still landing or failed, an item that vanished, or the form itself. */
export type SheetModel =
  | { readonly kind: "pending"; readonly status: ReadStatus }
  | { readonly kind: "missing" }
  | {
      readonly kind: "form";
      /** The identity of the form: another item, month, currency or language rebuilds it rather than patching it. */
      readonly key: string;
      readonly item: StoredItem | undefined;
      /** The month the sheet shows, the calendar fallback included. */
      readonly displayMonth: YearMonth;
      /** The stored active month: the only month a save may be planned against (#82's planning rule). */
      readonly storedMonth: YearMonth | undefined;
      readonly baseCurrency: CurrencyCode;
      /** The currencies items already use, most used first (#61, decision 4). */
      readonly usedCurrencies: readonly CurrencyCode[];
      /** Where a new item lands in the list's manual order. */
      readonly nextSortOrder: number;
      /** Every override in the database; only the editing item's rows are planned (#83). */
      readonly overrides: readonly OccurrenceOverride[];
      /** The app language the form is written in. */
      readonly lang: Language;
    };

/** The model behind the sheet, from the state of its reads. */
export function sheetModel(reads: SheetReads): SheetModel {
  const status = worstStatus([
    reads.month.status,
    reads.settings.status,
    reads.items.status,
    reads.overrides.status,
  ]);
  const displayMonth = reads.month.month;
  if (status !== "ready" || displayMonth === undefined) return { kind: "pending", status };
  const stored = reads.items.value;
  const items = stored === undefined ? [] : stored.items;
  const item =
    reads.itemId === undefined ? undefined : items.find((row) => row.id === reads.itemId);
  if (reads.itemId !== undefined && item === undefined) return { kind: "missing" };
  const storedMonth = reads.month.stored;
  const baseCurrency = reads.settings.value?.baseCurrency ?? DEFAULT_SETTINGS.baseCurrency;
  return {
    kind: "form",
    key: sheetKey(reads.itemId, displayMonth, storedMonth, baseCurrency, reads.lang),
    item,
    displayMonth,
    storedMonth,
    baseCurrency,
    usedCurrencies: usedCurrencies(items),
    nextSortOrder: nextSortOrder(items),
    overrides: reads.overrides.value?.overrides ?? [],
    lang: reads.lang,
  };
}

/** A state the user has to be told about outranks one they are still waiting for. */
function worstStatus(statuses: readonly ReadStatus[]): ReadStatus {
  if (statuses.includes("error")) return "error";
  return statuses.includes("loading") ? "loading" : "ready";
}

/** The form's identity: what it was built from. */
function sheetKey(
  itemId: string | undefined,
  displayMonth: YearMonth,
  storedMonth: YearMonth | undefined,
  baseCurrency: CurrencyCode,
  lang: Language,
): string {
  return [itemId ?? "new", displayMonth, storedMonth ?? "none", baseCurrency, lang].join("|");
}

/** The sort order of a new item: behind everything the list already holds (#63). */
function nextSortOrder(items: readonly StoredItem[]): number {
  return items.reduce((highest, item) => Math.max(highest, item.sortOrder), -1) + 1;
}

/** The currencies items already use, most used first and ties A–Z (#61, decision 4). */
function usedCurrencies(items: readonly StoredItem[]): CurrencyCode[] {
  const counts = new Map<CurrencyCode, number>();
  for (const item of items) {
    counts.set(item.currency, (counts.get(item.currency) ?? 0) + 1);
  }
  const ordered = [...counts.entries()];
  ordered.sort((first, second) => second[1] - first[1] || (first[0] < second[0] ? -1 : 1));
  return ordered.map(([code]) => code);
}

/** The notice of #64 about a scheduled change: `kept` is the one that stays, otherwise it is replaced. */
export interface ScheduledNotice {
  readonly month: YearMonth;
  readonly kept: boolean;
}

/** The scheduled-change notice the plan carries, if any. */
export function scheduledNotice(plan: RuleEditPlan | undefined): ScheduledNotice | undefined {
  const kept = findNotice(plan, "scheduled-change-kept");
  if (kept !== undefined) return { month: kept, kept: true };
  const replaced = findNotice(plan, "scheduled-change-replaced");
  return replaced === undefined ? undefined : { month: replaced, kept: false };
}

/** Whether the plan leaves the item with no versions, so saving it archives it (#64, #81). */
export function archivesItem(plan: RuleEditPlan | undefined): boolean {
  return (plan?.notices ?? []).some((notice) => notice.code === "no-versions-left");
}

/** The month of the notice with this code, if the plan carries one. */
function findNotice(
  plan: RuleEditPlan | undefined,
  code: "scheduled-change-kept" | "scheduled-change-replaced",
): YearMonth | undefined {
  const notice = (plan?.notices ?? []).find((row) => row.code === code);
  return notice?.code === code ? notice.month : undefined;
}

/** The sheet's title (#63): a read-only item is "Item", not "Edit item". */
export function titleKey(
  editing: boolean,
  readOnly: boolean,
): "form.titleView" | "form.titleEdit" | "form.titleNew" {
  if (readOnly) return "form.titleView";
  return editing ? "form.titleEdit" : "form.titleNew";
}

/** The sheet's main action: "Add" while creating, "Save" while editing (#63). */
export function saveAction(editing: boolean): {
  readonly labelKey: "form.add" | "form.save";
  readonly testID: "item-add" | "item-save";
} {
  return editing
    ? { labelKey: "form.save", testID: "item-save" }
    : { labelKey: "form.add", testID: "item-add" };
}

/** The copy of the scheduled notice as keys. A kept change offers "Replace"; once replace is chosen the notice
offers "Keep the scheduled change" to undo it (#64, decision 3), and a replaced one only says what will happen. */
export function scheduledNoticeCopy(
  notice: ScheduledNotice,
  replacing: boolean,
): ScheduledNoticeCopy {
  const kept = notice.kept && !replacing;
  return {
    titleKey: notice.kept ? "notice.scheduledKept.title" : "notice.scheduledReplaced.title",
    bodyKey: notice.kept ? "notice.scheduledKept.body" : "notice.scheduledReplaced.body",
    actionKey: kept ? "notice.scheduledKept.replace" : "notice.scheduledReplaced.keep",
    actionTestID: kept ? "item-notice-scheduled-replace" : "item-notice-scheduled-keep",
  };
}

/** The keys the scheduled notice shows, with the test ID of the action it offers. */
export interface ScheduledNoticeCopy {
  readonly titleKey: "notice.scheduledKept.title" | "notice.scheduledReplaced.title";
  readonly bodyKey: "notice.scheduledKept.body" | "notice.scheduledReplaced.body";
  readonly actionKey: "notice.scheduledKept.replace" | "notice.scheduledReplaced.keep";
  readonly actionTestID: "item-notice-scheduled-replace" | "item-notice-scheduled-keep";
}

/**
 * What to announce when the notices change (#64): the scheduled change first, then the months that keep their own
 * amount; silence while there is nothing to report. The component turns this into a sentence.
 */
export type SheetAnnouncement =
  | { readonly kind: "silent" }
  | { readonly kind: "scheduled"; readonly notice: ScheduledNotice }
  | { readonly kind: "kept"; readonly count: number };

/** The newest thing the notices have to say. */
export function sheetAnnouncement(
  plan: RuleEditPlan | undefined,
  notice: ScheduledNotice | undefined,
): SheetAnnouncement {
  if (notice !== undefined) return { kind: "scheduled", notice };
  const count = plan?.keptOverrides.length ?? 0;
  return count === 0 ? { kind: "silent" } : { kind: "kept", count };
}

/** What a refused save means to the user: the month-closed recovery, or one generic failure (#64). Never a code. */
export type SaveFailure =
  | { readonly kind: "month-closed"; readonly month: YearMonth }
  | { readonly kind: "one-time-closed" }
  | { readonly kind: "save-failed" };

/** What one run of the save decided: written, refused, held for a confirmation, or stopped by the form itself. */
export type SaveOutcome =
  /** Nothing was planned or written: there is no stored active month to plan against (#82's planning rule). */
  | { readonly kind: "blocked" }
  | { readonly kind: "saved" }
  | { readonly kind: "invalid" }
  | { readonly kind: "orphans" }
  | { readonly kind: "failure"; readonly failure: SaveFailure };

/**
 * What a refused plan or write means to the user (#64). `month-closed` is the recovery of #64 for a recurring
 * item and the closed one-time item for a one-time one; every other code is the one generic failure, because a
 * code is never shown.
 */
export function saveFailureOf(
  error: RuleEditError | OccurrenceErrorCode,
  oneTime: boolean,
): SaveFailure {
  if (error.code !== "month-closed") return { kind: "save-failed" };
  return oneTime ? { kind: "one-time-closed" } : { kind: "month-closed", month: error.month };
}
