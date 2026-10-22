// The items list model (#112): stored items in, the rows of the two sections out. Which version of an item is in
// force, what its schedule does from the active month and in which order the list shows them is decided here, in
// plain functions the app renders and the tests pin down; translating and formatting happen in the screen.
import {
  type CurrencyCode,
  DEFAULT_SETTINGS,
  type ItemType,
  type Language,
  type MinorUnits,
  monthsBetween,
  negateMinorUnits,
  type Settings,
  versionInForce,
  type YearMonth,
} from "@budget-lens/core";
import type { ItemsRead, StoredItem } from "@budget-lens/db";
import { type SummaryPart, summarizeVersion } from "./recurrence-summary";

/** What one row of the list shows. */
export interface ItemRow {
  readonly id: string;
  readonly name: string;
  readonly itemType: ItemType;
  /** The item's own currency: the amount is in its minor units and is formatted in it. */
  readonly currency: CurrencyCode;
  /** The amount of the shown version, signed for the list: income positive, expense negative. */
  readonly amount: MinorUnits;
  readonly summary: readonly SummaryPart[];
  /** The month of the first change scheduled after the active month; the "Change from" badge. */
  readonly changeFrom: YearMonth | undefined;
  /** A foreign-currency item, whose base-currency value the list would show next to the amount. */
  readonly foreign: boolean;
  /** `items.sort_order`: the manual order of the list, before the name. */
  readonly sortOrder: number;
}

/** The list model: the two sections of the Items tab, each in list order. */
export interface ItemSections {
  readonly income: readonly ItemRow[];
  readonly expenses: readonly ItemRow[];
}

export interface ItemRowContext {
  readonly activeMonth: YearMonth;
  /** The UI language, for month names, ordinals and the name collator. */
  readonly lang: Language;
  readonly baseCurrency: CurrencyCode;
}

/**
 * The version a row shows: the one in force in the active month, or the first one when the item only starts
 * later (#63: such an item is listed with its first version's amount and a "from" summary).
 */
function shownVersion(item: StoredItem, activeMonth: YearMonth) {
  return versionInForce(item.versions, activeMonth) ?? item.versions[0];
}

/**
 * The month of the first version that changes the item after the active month. Nothing before the active month
 * counts: it is history. An item that has not started yet returns nothing, because its summary already says
 * which month it starts from and a badge would only repeat it.
 */
function scheduledChange(item: StoredItem, activeMonth: YearMonth): YearMonth | undefined {
  if (versionInForce(item.versions, activeMonth) === undefined) {
    return undefined;
  }
  return item.versions.find((version) => monthsBetween(activeMonth, version.effectiveFrom) > 0)
    ?.effectiveFrom;
}

/** The row of one item, or `undefined` when it has no version to show at all. */
function itemRow(item: StoredItem, context: ItemRowContext): ItemRow | undefined {
  const version = shownVersion(item, context.activeMonth);
  if (version === undefined) {
    return undefined;
  }
  return {
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    currency: item.currency,
    // The sign is the list's signal for the kind, never colour alone (#58); amounts are stored positive.
    amount: item.itemType === "expense" ? negateMinorUnits(version.amount) : version.amount,
    summary: summarizeVersion(version, context.activeMonth),
    changeFrom: scheduledChange(item, context.activeMonth),
    // No rate store exists yet (#92), so a foreign item never has a base-currency value to show.
    foreign: item.currency !== context.baseCurrency,
    sortOrder: item.sortOrder,
  };
}

/**
 * Rows in list order: `sort_order` first and then the name, compared the way the UI language reads it. Base
 * sensitivity keeps "Łukasz" beside "Lokal".
 */
function sortItemRows(rows: readonly ItemRow[], lang: Language): ItemRow[] {
  const collator = new Intl.Collator(lang === "pl" ? "pl-PL" : "en-GB", { sensitivity: "base" });
  return [...rows].sort((a, b) => a.sortOrder - b.sortOrder || collator.compare(a.name, b.name));
}

/**
 * The two sections of the Items tab, income first and then expenses (#58 order), each in the list order of
 * {@link sortItemRows}. Items with no version at all are left out: there is nothing to show for them, and the
 * list has no row without an amount.
 */
export function itemSections(items: readonly StoredItem[], context: ItemRowContext): ItemSections {
  const rows = items.map((item) => itemRow(item, context)).filter((row) => row !== undefined);
  const ofKind = (kind: ItemType) =>
    sortItemRows(
      rows.filter((row) => row.itemType === kind),
      context.lang,
    );
  return { income: ofKind("income"), expenses: ofKind("expense") };
}

/** The state of one of the reads a list is built from. */
export type ReadStatus = "loading" | "ready" | "error";

/** A live read reduced to what the list decides with: its state and, when it landed, its value. */
export interface Read<T> {
  readonly status: ReadStatus;
  readonly value: T | undefined;
}

/** Everything an items list is built from: its three reads and the UI language. */
export interface ItemReads {
  /** The items of the database, archived ones included. */
  readonly items: Read<ItemsRead>;
  /** The stored settings; absent as a value when the `settings` table has no row (#78). */
  readonly settings: Read<Settings>;
  /** The month the list anchors to: `useActiveMonth`'s answer, clock fallback included. */
  readonly month: Read<YearMonth>;
  readonly lang: Language;
  /** The read-only archived list rather than the list of active items. */
  readonly archived: boolean;
}

/** A list together with the state of the reads behind it. */
export interface ListedRead extends ListedItems {
  readonly status: ReadStatus;
}

/** Where each read state ranks: what the user has to be told about outranks what they have to wait for. */
const RANK: Record<ReadStatus, number> = { ready: 0, loading: 1, error: 2 };

/** The state of the list: the worst of the states of its reads. */
function worst(first: ReadStatus, second: ReadStatus, third: ReadStatus): ReadStatus {
  return [first, second, third].reduce((worstSoFar, next) =>
    RANK[next] > RANK[worstSoFar] ? next : worstSoFar,
  ) as ReadStatus;
}

/** What a list shows before every read has landed: no rows, and no empty state either. */
const NOTHING: ListedItems = {
  sections: { income: [], expenses: [] },
  hasInvalidItems: false,
  empty: false,
  archivedCount: 0,
};

/**
 * The list behind a screen's reads, deciding what they add up to rather than what each one says.
 *
 * Rows appear only once all three have landed. A read that failed – the items, the settings *or the month* –
 * is the error the screen retries, so none of them is quietly replaced by a guess: no base currency invented for
 * a settings table that could not be read, and no device calendar month invented for a month that could not be
 * read (#38, #63 states). The core default is used only for the one case it describes: a settings read that
 * succeeded and found no row, which is a fresh install (#78).
 */
export function listFromReads(reads: ItemReads): ListedRead {
  const { items, settings, month, lang, archived } = reads;
  const status = worst(items.status, settings.status, month.status);
  if (status !== "ready" || items.value === undefined || month.value === undefined) {
    return { ...NOTHING, status };
  }
  return {
    ...listItems(items.value, {
      activeMonth: month.value,
      lang,
      baseCurrency: settings.value?.baseCurrency ?? DEFAULT_SETTINGS.baseCurrency,
      ...(archived ? { onlyArchived: true } : {}),
    }),
    status,
  };
}

/** What a list read is turned into: the list model plus what the read reported. */
export interface ListedItems {
  readonly sections: ItemSections;
  /** The read reported items it could not use: the screen says some items are hidden (#88). */
  readonly hasInvalidItems: boolean;
  /** Nothing to list, so the screen shows its empty state. False until a read has landed (#63 states). */
  readonly empty: boolean;
  /** The archived items the read saw: the count of the "Archived items" row, which grows as rows are archived. */
  readonly archivedCount: number;
}

/**
 * The rows of one list read, in the order of {@link sortItemRows}.
 *
 * `onlyArchived` keeps just the archived items, which is what the read-only archived list shows. The hook reads
 * both kinds at once, because the count of the "Archived items" row comes from the same read, so each list also
 * takes the unreadable items of its own kind and leaves the other's out: a damaged archived row is no reason for
 * the active list to say it is hiding something (#219 N1).
 *
 * `archivedCount` counts the archived items of the read whatever the screen lists, so it needs a read made with
 * `includeArchived`. `empty` is true only once a read has landed: a list that has not been read yet is not an
 * empty one, and its empty state must not flash before the rows arrive.
 */
export function listItems(
  read: ItemsRead | undefined,
  context: ItemRowContext & { readonly onlyArchived?: boolean },
): ListedItems {
  const stored = read?.items ?? [];
  const listed =
    context.onlyArchived === true
      ? stored.filter((item) => item.archivedAt !== null)
      : stored.filter((item) => item.archivedAt === null);
  const { onlyArchived, ...rows } = context;
  const sections = itemSections(listed, rows);
  const unreadable = (read?.invalidItems ?? []).filter(
    (invalid) => (invalid.archivedAt !== null) === (onlyArchived === true),
  );
  return {
    sections,
    hasInvalidItems: unreadable.length > 0,
    empty: read !== undefined && sections.income.length === 0 && sections.expenses.length === 0,
    archivedCount: stored.filter((item) => item.archivedAt !== null).length,
  };
}
