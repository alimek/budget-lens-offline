// The items and rule-version repository (#81): `items` and `item_rule_versions` rows in, `@budget-lens/core`
// types out. Which version is in force in a month stays in core (#80): nothing here resolves or merges versions.
import {
  type CurrencyCode,
  type ItemType,
  isCurrencyCode,
  type RuleEditPlan,
  type RuleVersion,
  type RuleVersionErrorCode,
  type Schedule,
  type ScheduleErrorCode,
  validateRuleVersions,
  validateSchedule,
  type YearMonth,
} from "@budget-lens/core";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

/**
 * A synchronous Drizzle SQLite database with schema v1: expo-sqlite in the app, sql.js in tests.
 */
// biome-ignore lint/suspicious/noExplicitAny: accepts databases with any schema and run-result type.
type Database = BaseSQLiteDatabase<"sync", any, any>;

/** `created_at` / `updated_at` and new row ids are injected; the repository reads no clock and no RNG. */
export interface ItemsRepositoryDeps {
  /** UTC epoch milliseconds for the timestamp columns. */
  readonly now: () => number;
  /** The id of a new rule-version row (`randomUUID()` from expo-crypto in the app). */
  readonly newId: () => string;
}

/** The tables `readItems` reads. A live hook re-runs the list when any of them changes (#35 §4). */
export const ITEM_LIST_TABLES = ["items", "item_rule_versions"] as const;

/** An item row and its versions in the shape core consumes: a `VersionedItem` with its item-level fields. */
export interface StoredItem {
  readonly id: string;
  /** `items.kind`. */
  readonly itemType: ItemType;
  /** `items.currency`: every amount of every version is in this currency's minor units. */
  readonly currency: CurrencyCode;
  readonly name: string;
  readonly note: string | null;
  readonly sortOrder: number;
  /** Set when the item is archived; an item is never hard-deleted (#81). */
  readonly archivedAt: Date | null;
  /** All versions in `effectiveFrom` order; picking the one in force per month is core's job (#80). */
  readonly versions: readonly RuleVersion[];
}

/** Why a stored item cannot be read. `unsupported-currency` and `invalid-item-type` are the row's own fields. */
export type StoredItemErrorCode =
  | "unsupported-currency"
  | "invalid-item-type"
  | RuleVersionErrorCode
  | ScheduleErrorCode;

/** An item the repository left out, with the core error codes that say why (#88 reports these). */
export interface InvalidItem {
  readonly itemId: string;
  readonly errors: readonly StoredItemErrorCode[];
}

/** An item list read: what core can use, and what was left out and reported instead of dropped (#92 pattern). */
export interface ItemsRead {
  readonly items: readonly StoredItem[];
  readonly invalidItems: readonly InvalidItem[];
}

/** What a write rejected, as codes and parameters for the UI to translate. */
export type ItemErrorCode =
  | { readonly code: "item-not-found" }
  | { readonly code: "immutable-field"; readonly field: "currency" | "kind" }
  | { readonly code: "missing-base-currency" }
  | { readonly code: "unsupported-currency" }
  | { readonly code: "invalid-versions"; readonly errors: readonly RuleVersionErrorCode[] };

export type ItemResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: ItemErrorCode };

const rejected = (error: ItemErrorCode): ItemResult => ({ ok: false, error });

type ItemRow = typeof schema.items.$inferSelect;
type RuleVersionRow = typeof schema.itemRuleVersions.$inferSelect;

/** `interval_months` NULL is a one-time schedule in `target_month`; otherwise it repeats from `anchor_month`. */
function toSchedule(row: RuleVersionRow): Schedule {
  const dayOfMonth = row.dayOfMonth === null ? {} : { dayOfMonth: row.dayOfMonth };
  // The shape CHECK keeps `target_month`/`anchor_month` present for their kind; a corrupt row keeps its NULL
  // and core rejects the schedule, so a damaged row is reported instead of throwing here.
  return row.intervalMonths === null
    ? { kind: "one-time", month: row.targetMonth as YearMonth, ...dayOfMonth }
    : {
        kind: "recurring",
        intervalMonths: row.intervalMonths,
        anchor: row.anchorMonth as YearMonth,
        ...dayOfMonth,
        ...(row.endMonth === null ? {} : { endMonth: row.endMonth }),
      };
}

const toVersion = (row: RuleVersionRow): RuleVersion => ({
  effectiveFrom: row.effectiveFrom,
  amount: row.amountMinor,
  schedule: toSchedule(row),
});

/** The core schedule as columns: one-time writes `target_month`, recurring writes `anchor_month`. */
function versionValues(itemId: string, id: string, version: RuleVersion, createdAt: Date) {
  const { schedule } = version;
  return {
    id,
    itemId,
    effectiveFrom: version.effectiveFrom,
    amountMinor: version.amount,
    dayOfMonth: schedule.dayOfMonth ?? null,
    // One-time writes `target_month` and leaves the recurrence columns NULL; recurring does the opposite.
    ...(schedule.kind === "one-time"
      ? {
          intervalMonths: null,
          anchorMonth: null,
          targetMonth: schedule.month,
          endMonth: null,
        }
      : {
          intervalMonths: schedule.intervalMonths,
          anchorMonth: schedule.anchor,
          targetMonth: null,
          endMonth: schedule.endMonth ?? null,
        }),
    createdAt,
  };
}

/** One row of `items` plus its versions: the item for core, or what is wrong with the row. */
function toItem(row: ItemRow, versions: readonly RuleVersion[]): StoredItem | InvalidItem {
  const errors = new Set<StoredItemErrorCode>();
  if (row.kind !== "expense" && row.kind !== "income") {
    errors.add("invalid-item-type");
  }
  if (!isCurrencyCode(row.currency)) {
    errors.add("unsupported-currency");
  }
  // A plan that deletes every version archives its item, so an archived item may legitimately have none: its
  // versions are history and never reach the forecast, and only active items are checked (#81, #88).
  if (row.archivedAt === null) {
    for (const error of validateRuleVersions(versions)) {
      errors.add(error);
    }
  }
  if (errors.size > 0) {
    for (const version of versions) {
      for (const error of validateSchedule(version.schedule)) {
        errors.add(error);
      }
    }
    return { itemId: row.id, errors: [...errors] };
  }
  return {
    id: row.id,
    itemType: row.kind,
    currency: row.currency,
    name: row.name,
    note: row.note,
    sortOrder: row.sortOrder,
    archivedAt: row.archivedAt,
    versions,
  };
}

/** Group the version rows under their items; both lists arrive in `effectiveFrom` / list order. */
function readRows(rows: readonly ItemRow[], versionRows: readonly RuleVersionRow[]): ItemsRead {
  const byItem = new Map<string, RuleVersionRow[]>();
  for (const row of versionRows) {
    const list = byItem.get(row.itemId);
    if (list === undefined) {
      byItem.set(row.itemId, [row]);
    } else {
      list.push(row);
    }
  }
  const items: StoredItem[] = [];
  const invalidItems: InvalidItem[] = [];
  for (const row of rows) {
    const parsed = toItem(row, (byItem.get(row.id) ?? []).map(toVersion));
    if ("errors" in parsed) invalidItems.push(parsed);
    else items.push(parsed);
  }
  return { items, invalidItems };
}

/**
 * The items with their rule versions, in `sort_order` order and each item's versions in `effectiveFrom` order.
 * Archived items are left out unless asked for: archiving keeps the item and its versions (#81).
 *
 * Two single-table reads, never a join, so a live hook can depend on {@link ITEM_LIST_TABLES} alone (#35 §4).
 * An item whose row or versions fail core validation is reported in `invalidItems` and left out of `items`, so
 * one damaged row never loses the list or throws (#88 filters and reports them before `forecast()`).
 */
export function readItems(
  db: Database,
  options: { readonly includeArchived?: boolean } = {},
): ItemsRead {
  const rows = db
    .select()
    .from(schema.items)
    .where(options.includeArchived === true ? undefined : isNull(schema.items.archivedAt))
    .orderBy(asc(schema.items.sortOrder), asc(schema.items.createdAt))
    .all();
  const versionRows = db
    .select()
    .from(schema.itemRuleVersions)
    .orderBy(asc(schema.itemRuleVersions.effectiveFrom))
    .all();
  return readRows(rows, versionRows);
}

function findItem(db: Database, id: string): ItemRow | undefined {
  return db.select().from(schema.items).where(eq(schema.items.id, id)).get();
}

/** The item's own versions, in `effectiveFrom` order. */
function storedVersions(db: Database, itemId: string): RuleVersion[] {
  return db
    .select()
    .from(schema.itemRuleVersions)
    .where(eq(schema.itemRuleVersions.itemId, itemId))
    .orderBy(asc(schema.itemRuleVersions.effectiveFrom))
    .all()
    .map(toVersion);
}

/** The versions an item has left after a plan: what core's `applyRuleEditPlan` computes (#80). */
function resultingVersions(
  stored: readonly RuleVersion[],
  plan: RuleVersionChanges,
): RuleVersion[] {
  const deleted = new Set<string>(plan.deleteVersions);
  const upserted = new Set<string>(plan.upsertVersions.map(({ effectiveFrom }) => effectiveFrom));
  return stored
    .filter(({ effectiveFrom }) => !deleted.has(effectiveFrom) && !upserted.has(effectiveFrom))
    .concat(plan.upsertVersions);
}

/** The base currency of the `settings` singleton, or `undefined` when it is missing or unreadable (#139). */
function baseCurrency(db: Database): CurrencyCode | undefined {
  const [row] = db
    .select({ currency: schema.settings.baseCurrency })
    .from(schema.settings)
    .where(eq(schema.settings.id, 1))
    .all();
  return row !== undefined && isCurrencyCode(row.currency) ? row.currency : undefined;
}

/** A new item and its versions, written in one transaction. */
export interface NewItem {
  readonly id: string;
  /** Fixed after creation, like `currency` (#40). */
  readonly kind: ItemType;
  readonly name: string;
  /** Omitted means the base currency from `settings`: the column has no SQL default (#35 Q5, #138). */
  readonly currency?: CurrencyCode;
  readonly note?: string;
  readonly sortOrder?: number;
  /** At least one version: an item without versions has no occurrence in any month (#80). */
  readonly versions: readonly RuleVersion[];
}

/** Item fields a rename or a form may change. */
export interface ItemPatch {
  readonly name?: string;
  readonly note?: string | null;
  readonly sortOrder?: number;
  /**
   * A form may post the whole item back: `currency` and `kind` are accepted only when they equal what is
   * stored. Both are fixed after creation (#40, [#81 owner decision](https://github.com/alimek/budget-lens-offline/issues/81#issuecomment-6276228839)).
   */
  readonly currency?: CurrencyCode;
  readonly kind?: ItemType;
}

/** The versions a core `RuleEditPlan` writes. Its override fields are occurrence overrides (#83) and stay with the caller. */
export type RuleVersionChanges = Pick<RuleEditPlan, "upsertVersions" | "deleteVersions">;

/**
 * Creates an item with its rule versions in one transaction. A missing `currency` is the base currency of the
 * `settings` singleton, so an item never stores a currency the user did not choose (#138).
 */
export function createItem(db: Database, item: NewItem, deps: ItemsRepositoryDeps): ItemResult {
  const versionErrors = validateRuleVersions(item.versions);
  if (versionErrors.length > 0) {
    return rejected({ code: "invalid-versions", errors: versionErrors });
  }
  const currency = item.currency ?? baseCurrency(db);
  if (currency === undefined) {
    return rejected({ code: "missing-base-currency" });
  }
  if (!isCurrencyCode(currency)) {
    return rejected({ code: "unsupported-currency" });
  }
  const createdAt = new Date(deps.now());
  db.transaction((tx) => {
    tx.insert(schema.items)
      .values({
        id: item.id,
        kind: item.kind,
        name: item.name,
        currency,
        note: item.note ?? null,
        sortOrder: item.sortOrder ?? 0,
        createdAt,
        updatedAt: createdAt,
      })
      .run();
    for (const version of item.versions) {
      tx.insert(schema.itemRuleVersions)
        .values(versionValues(item.id, deps.newId(), version, createdAt))
        .run();
    }
  });
  return { ok: true };
}

/**
 * Renames an item or moves it in the list. Changing `currency` or `kind` is rejected: an item keeps its
 * currency and kind for its whole life, and its rule versions are amounts in that currency (#81).
 */
export function updateItem(
  db: Database,
  id: string,
  patch: ItemPatch,
  deps: ItemsRepositoryDeps,
): ItemResult {
  const stored = findItem(db, id);
  if (stored === undefined) {
    return rejected({ code: "item-not-found" });
  }
  if (patch.currency !== undefined && patch.currency !== stored.currency) {
    return rejected({ code: "immutable-field", field: "currency" });
  }
  if (patch.kind !== undefined && patch.kind !== stored.kind) {
    return rejected({ code: "immutable-field", field: "kind" });
  }
  db.update(schema.items)
    .set({
      ...(patch.name === undefined ? {} : { name: patch.name }),
      ...(patch.note === undefined ? {} : { note: patch.note }),
      ...(patch.sortOrder === undefined ? {} : { sortOrder: patch.sortOrder }),
      updatedAt: new Date(deps.now()),
    })
    .where(eq(schema.items.id, id))
    .run();
  return { ok: true };
}

/**
 * Archives an item, keeping the item row and every version (#81: archive instead of hard delete), so closed
 * months keep the snapshot and a later un-archive could restore the rule. Archiving twice is a no-op.
 */
export function archiveItem(db: Database, id: string, deps: ItemsRepositoryDeps): ItemResult {
  const stored = findItem(db, id);
  if (stored === undefined) {
    return rejected({ code: "item-not-found" });
  }
  if (stored.archivedAt !== null) {
    return { ok: true };
  }
  const archivedAt = new Date(deps.now());
  db.update(schema.items)
    .set({ archivedAt, updatedAt: archivedAt })
    .where(eq(schema.items.id, id))
    .run();
  return { ok: true };
}

/**
 * Persists the version part of a core `RuleEditPlan` (#80) in one transaction: `upsertVersions` by
 * `(item_id, effective_from)` with an UPSERT, `deleteVersions` by `effective_from`.
 *
 * What is validated is the item's **resulting** version list, not the subset the plan writes: a plan may delete
 * versions and write none (core's `cancel-scheduled` and a `stop-from` that empties the item), and validating the
 * subset would reject every such plan with `no-versions`. When the plan leaves the item with no versions at all
 * (core's `no-versions-left` notice), the item is archived in the same transaction: #81 archives instead of
 * deleting, and an active item without versions would be a versionless rule rather than an unused one.
 *
 * The plan's `upsertOverrides`, `orphanedOverrides` and `resetOverrides` are occurrence overrides, which belong
 * to #83: this repository does not write them, so the caller writes or confirms them itself.
 */
export function applyRuleVersionPlan(
  db: Database,
  itemId: string,
  plan: RuleVersionChanges,
  deps: ItemsRepositoryDeps,
): ItemResult {
  const stored = findItem(db, itemId);
  if (stored === undefined) {
    return rejected({ code: "item-not-found" });
  }
  const remaining = resultingVersions(storedVersions(db, itemId), plan);
  const emptied = remaining.length === 0;
  const versionErrors = emptied ? [] : validateRuleVersions(remaining);
  if (versionErrors.length > 0) {
    return rejected({ code: "invalid-versions", errors: versionErrors });
  }
  const createdAt = new Date(deps.now());
  db.transaction((tx) => {
    if (plan.deleteVersions.length > 0) {
      tx.delete(schema.itemRuleVersions)
        .where(
          and(
            eq(schema.itemRuleVersions.itemId, itemId),
            inArray(schema.itemRuleVersions.effectiveFrom, [...plan.deleteVersions]),
          ),
        )
        .run();
    }
    for (const version of plan.upsertVersions) {
      const values = versionValues(itemId, deps.newId(), version, createdAt);
      tx.insert(schema.itemRuleVersions)
        .values(values)
        .onConflictDoUpdate({
          target: [schema.itemRuleVersions.itemId, schema.itemRuleVersions.effectiveFrom],
          set: {
            amountMinor: values.amountMinor,
            intervalMonths: values.intervalMonths,
            anchorMonth: values.anchorMonth,
            targetMonth: values.targetMonth,
            dayOfMonth: values.dayOfMonth,
            endMonth: values.endMonth,
          },
        })
        .run();
    }
    // The last version is gone: archive the item instead of leaving it active with an empty rule (#81).
    if (emptied && stored.archivedAt === null) {
      tx.update(schema.items)
        .set({ archivedAt: createdAt, updatedAt: createdAt })
        .where(eq(schema.items.id, itemId))
        .run();
    }
  });
  return { ok: true };
}
