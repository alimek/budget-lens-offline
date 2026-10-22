// The occurrence override and payment status repository (#83): `occurrence_overrides` and `payment_statuses` rows
// in, `@budget-lens/core` types out. What a valid override is, which occurrence it applies to and which month is
// closed stay in core (docs/domain/occurrence-overrides.md, docs/domain/month-closing.md): this file only maps
// columns, guards closed months and decides what to write. Nothing here converts an amount: an override is in the
// currency of the item it overrides, and a month is `YYYY-MM` text, never a date or a time zone.
import {
  type ItemInForce,
  type ItemType,
  isYearMonth,
  itemInForce,
  type MinorUnits,
  monthsBetween,
  type OccurrenceOverride,
  type OverrideErrorCode,
  type PaymentStatus,
  type ResolvedOccurrence,
  type RuleEditContext,
  type RuleEditPlan,
  resolveVersionedOccurrences,
  validateOverride,
  validateStoredOverride,
  type YearMonth,
} from "@budget-lens/core";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { AnySQLiteColumn, BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import {
  type InvalidItem,
  type ItemErrorCode,
  readItems,
  ruleVersionPlanError,
  type StoredItem,
  type StoredItemErrorCode,
  writeRuleVersions,
} from "./items-repository";
import * as schema from "./schema";

/**
 * A synchronous Drizzle SQLite database with schema v1: expo-sqlite in the app, sql.js in tests.
 */
// biome-ignore lint/suspicious/noExplicitAny: accepts databases with any schema and run-result type.
type Database = BaseSQLiteDatabase<"sync", any, any>;

/** `created_at` / `updated_at` / `settled_at` and new row ids are injected; the repository reads no clock and no RNG. */
export interface OccurrencesRepositoryDeps {
  /** UTC epoch milliseconds for the timestamp columns. */
  readonly now: () => number;
  /** The id of a new override row (`randomUUID()` from expo-crypto in the app). */
  readonly newId: () => string;
}

/** The tables `readOverrides` reads. A live hook re-runs it when any of them changes (#35 §4). */
export const OVERRIDE_TABLES = ["occurrence_overrides", "items"] as const;

/** The tables `readPaymentStatuses` reads. */
export const PAYMENT_STATUS_TABLES = ["payment_statuses", "items"] as const;

/** The tables `readMonthOccurrences` reads. */
export const MONTH_OCCURRENCES_TABLES = [
  "items",
  "item_rule_versions",
  "occurrence_overrides",
  "payment_statuses",
] as const;

/** A stored override row that was left out, with the codes that say why. Core's `RejectedOverride` is one of these. */
export interface RejectedOverrideRow {
  readonly override: unknown;
  readonly errors: readonly OverrideReadErrorCode[];
}

/** Core's override codes, plus `unknown-item`: its `items` row is gone, which the foreign key normally rules out. */
export type OverrideReadErrorCode = OverrideErrorCode | "unknown-item";

/** An override read: what core can use, and what was left out and reported instead of dropped (#92 pattern). */
export interface OverridesRead {
  readonly overrides: readonly OccurrenceOverride[];
  readonly rejectedOverrides: readonly RejectedOverrideRow[];
}

/** Why a write was refused, as codes and parameters for the UI to translate; never a message. */
export type OccurrenceErrorCode =
  /** `applyRulePlan` also writes rule versions, so it can report #81's codes. */
  | ItemErrorCode
  /** The item's row or versions are damaged, so its rule cannot be resolved to write against. */
  | { readonly code: "invalid-item"; readonly errors: readonly StoredItemErrorCode[] }
  | { readonly code: "item-archived" }
  | { readonly code: "invalid-month" }
  | { readonly code: "month-closed"; readonly month: YearMonth }
  | { readonly code: "invalid-override"; readonly errors: readonly OverrideErrorCode[] };

export type OccurrenceResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: OccurrenceErrorCode };

const rejected = (error: OccurrenceErrorCode): OccurrenceResult => ({ ok: false, error });

type OverrideRow = typeof schema.occurrenceOverrides.$inferSelect;

/** `skipped: false` and a NULL `amount_minor` are absent in core's model, not fields with a value. */
function toOverride(row: OverrideRow, itemType: ItemType): OccurrenceOverride {
  return {
    id: row.id,
    itemType,
    itemId: row.itemId,
    month: row.month,
    ...(row.amountMinor === null ? {} : { amount: row.amountMinor }),
    ...(row.skipped ? { skipped: true } : {}),
    ...(row.note === null ? {} : { note: row.note }),
  };
}

/**
 * `items.kind` by item id, from one single-table select: an override has no type column, the key is
 * `(item_id, month)` and the type comes from the item (#35 Q1). Archived items are included: their overrides are
 * history rather than damage.
 */
function itemKinds(db: Database): Map<string, ItemType> {
  const rows = db.select({ id: schema.items.id, kind: schema.items.kind }).from(schema.items).all();
  return new Map(rows.map((row) => [row.id, row.kind]));
}

/** The `months` filter of a read; the caller has already handled the absent and empty cases. */
function monthFilter(column: AnySQLiteColumn, months: readonly YearMonth[]) {
  return inArray(column, [...months]);
}

/**
 * The stored overrides, mapped to core `OccurrenceOverride`s with `itemType` from `items.kind`. Only the listed
 * `months` are read when they are given.
 *
 * A row core rejects, or whose item is gone, is left out **and** reported in `rejectedOverrides`, never thrown:
 * one damaged row never loses the month (#92 pattern). The rows come from one table and the types from another, so
 * this is two single-table selects and no join (#35 §4).
 */
export function readOverrides(
  db: Database,
  options: { readonly months?: readonly YearMonth[] } = {},
): OverridesRead {
  // No months asked for reads every month; an empty list reads nothing, not everything.
  if (options.months !== undefined && options.months.length === 0) {
    return { overrides: [], rejectedOverrides: [] };
  }
  const rows = db
    .select()
    .from(schema.occurrenceOverrides)
    .where(
      options.months === undefined
        ? undefined
        : monthFilter(schema.occurrenceOverrides.month, options.months),
    )
    .orderBy(asc(schema.occurrenceOverrides.month))
    .all();
  const kinds = itemKinds(db);
  const overrides: OccurrenceOverride[] = [];
  const rejectedOverrides: RejectedOverrideRow[] = [];
  for (const row of rows) {
    const itemType = kinds.get(row.itemId);
    if (itemType === undefined) {
      rejectedOverrides.push({ override: row, errors: ["unknown-item"] });
      continue;
    }
    const override = toOverride(row, itemType);
    const errors = validateStoredOverride(override);
    if (errors.length > 0) {
      rejectedOverrides.push({ override, errors });
    } else {
      overrides.push(override);
    }
  }
  return { overrides, rejectedOverrides };
}

/**
 * The settled occurrences of `months` (all of them when no months are given), as core `PaymentStatus`es. A row
 * means paid (expense) or received (income): unsettled is the absence of a row (#35 Q4). The currency is not
 * here: payment status is independent of it, and the item carries its own (#39).
 */
export function readPaymentStatuses(
  db: Database,
  options: { readonly months?: readonly YearMonth[] } = {},
): readonly PaymentStatus[] {
  if (options.months !== undefined && options.months.length === 0) {
    return [];
  }
  const rows = db
    .select()
    .from(schema.paymentStatuses)
    .where(
      options.months === undefined
        ? undefined
        : monthFilter(schema.paymentStatuses.month, options.months),
    )
    .orderBy(asc(schema.paymentStatuses.month))
    .all();
  const kinds = itemKinds(db);
  return rows.flatMap((row) => {
    const itemType = kinds.get(row.itemId);
    return itemType === undefined
      ? []
      : [{ itemType, itemId: row.itemId, month: row.month, settled: true }];
  });
}

/** An effective occurrence of an open month, with whether its payment row is settled. */
export type MonthOccurrence = ResolvedOccurrence<ItemInForce<StoredItem>> & {
  readonly settled: boolean;
};

/** What {@link readMonthOccurrences} resolved for one month: the rows to show and what was left out. */
export interface MonthOccurrencesRead {
  readonly occurrences: readonly MonthOccurrence[];
  /** Override rows core did not apply, whether they were damaged or they matched nothing. */
  readonly rejectedOverrides: readonly RejectedOverrideRow[];
  /** Items `readItems` left out; every item it returns is valid, so the resolver reports none of its own. */
  readonly invalidItems: readonly InvalidItem[];
}

const paymentKey = (itemType: ItemType, itemId: string, month: YearMonth): string =>
  JSON.stringify([itemType, itemId, month]);

/**
 * One **open** month for the month view (#114) and for closing (#84): the active items' effective occurrences
 * after the rule version in force and their override, each with the item's `currency`, the effective `amount` and
 * whether it is settled. A closed month is read from its `closed_occurrences` snapshot instead (#85/#86), never
 * resolved again from the live rule (#40 Q3), so this function is not for closed months.
 *
 * A skipped occurrence is absent and its payment row is kept, applying again when the skip is cleared
 * (docs/domain/occurrence-overrides.md). Overrides are matched by `(item_id, month)`, never by name, and stay
 * independent of rule versions. Damaged rows are reported in `rejectedOverrides` / `invalidItems`, never thrown.
 */
export function readMonthOccurrences(db: Database, month: YearMonth): MonthOccurrencesRead {
  const { items, invalidItems } = readItems(db);
  const { overrides, rejectedOverrides } = readOverrides(db, { months: [month] });
  const settled = new Set(
    readPaymentStatuses(db, { months: [month] }).map((status) =>
      paymentKey(status.itemType, status.itemId, status.month),
    ),
  );
  const resolved = resolveVersionedOccurrences(items, overrides, month);
  return {
    occurrences: resolved.occurrences.map((occurrence) => ({
      ...occurrence,
      settled: settled.has(paymentKey(occurrence.item.itemType, occurrence.item.id, month)),
    })),
    rejectedOverrides: [...rejectedOverrides, ...resolved.rejectedOverrides],
    invalidItems,
  };
}

/**
 * The one closed-month policy, with core's code: core's `planRuleEdit` treats every month before the active month
 * as closed (docs/domain/rule-versions.md) and core's `validateMonthEditable` treats a `closed` row of the `months`
 * table as not editable (docs/domain/month-closing.md). The active month comes from the caller, as in core's
 * `RuleEditContext`, never from a clock: the months repository that reads it is #112.
 */
function closedMonthError(
  db: Database,
  month: YearMonth,
  { activeMonth }: RuleEditContext,
): OccurrenceErrorCode | undefined {
  if (!isYearMonth(month) || !isYearMonth(activeMonth)) {
    return { code: "invalid-month" };
  }
  if (monthsBetween(month, activeMonth) > 0) {
    return { code: "month-closed", month };
  }
  const stored = db
    .select({ status: schema.months.status })
    .from(schema.months)
    .where(eq(schema.months.month, month))
    .get();
  return stored?.status === "closed" ? { code: "month-closed", month } : undefined;
}

/**
 * The item a write targets: its `items` row and its versions as core reads them, or why it cannot be written.
 * An archived item is readable here and refused by the caller that must not edit it.
 */
function writableItem(
  db: Database,
  itemId: string,
):
  | { readonly item: StoredItem; readonly row: typeof schema.items.$inferSelect }
  | { readonly error: OccurrenceErrorCode } {
  const row = db.select().from(schema.items).where(eq(schema.items.id, itemId)).get();
  if (row === undefined) {
    return { error: { code: "item-not-found" } };
  }
  if (row.archivedAt !== null) {
    return { error: { code: "item-archived" } };
  }
  const read = readItems(db, { includeArchived: true });
  const invalid = read.invalidItems.find((entry) => entry.itemId === itemId);
  if (invalid !== undefined) {
    return { error: { code: "invalid-item", errors: invalid.errors } };
  }
  const item = read.items.find((entry) => entry.id === itemId);
  return item === undefined ? { error: { code: "item-not-found" } } : { item, row };
}

const currentOverride = (db: Database, itemId: string, month: YearMonth): OverrideRow | undefined =>
  db
    .select()
    .from(schema.occurrenceOverrides)
    .where(
      and(
        eq(schema.occurrenceOverrides.itemId, itemId),
        eq(schema.occurrenceOverrides.month, month),
      ),
    )
    .get();

/**
 * UPSERT on `(item_id, month)`: a second edit of the same occurrence replaces the first, keeps the row id and
 * `created_at`, and stamps `updated_at`. The row id is core's `OccurrenceOverride.id`: a new row carries the id its
 * caller was given, which is what a read hands back. `skipped: true` writes a NULL amount and the other way round,
 * which is what `overrides_shape_chk` requires.
 */
function writeOverride(
  db: Database,
  override: OccurrenceOverride,
  deps: OccurrencesRepositoryDeps,
): void {
  const stamped = new Date(deps.now());
  const values = {
    id: override.id,
    itemId: override.itemId,
    month: override.month,
    amountMinor: override.amount ?? null,
    skipped: override.skipped === true,
    note: override.note ?? null,
    createdAt: stamped,
    updatedAt: stamped,
  };
  db.insert(schema.occurrenceOverrides)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.occurrenceOverrides.itemId, schema.occurrenceOverrides.month],
      set: {
        amountMinor: values.amountMinor,
        skipped: values.skipped,
        note: values.note,
        updatedAt: stamped,
      },
    })
    .run();
}

function deleteOverride(db: Database, itemId: string, month: YearMonth): void {
  db.delete(schema.occurrenceOverrides)
    .where(
      and(
        eq(schema.occurrenceOverrides.itemId, itemId),
        eq(schema.occurrenceOverrides.month, month),
      ),
    )
    .run();
}

/** "Only this month": the amount of one occurrence, or that it is skipped. */
export interface OverrideChange {
  readonly itemId: string;
  readonly month: YearMonth;
  /**
   * Minor units of the **item's** currency, never converted (#138). Exactly one of `amount` and `skipped: true`,
   * which is core's rule (`empty-override`, `skipped-with-amount`), not a column default.
   */
  readonly amount?: MinorUnits;
  readonly skipped?: boolean;
  /** Absent means no note: an edit replaces the whole override. */
  readonly note?: string;
}

/**
 * Sets the override of one occurrence ("only this month"), core's `only-month` edit. The change is validated by
 * core against the item's version in force for that month, so a one-time item (`one-time-item`), a month with no
 * occurrence (`inactive-month`) and a shape that is not an override (`empty-override`, `skipped-with-amount`) are
 * refused and nothing is written. Writing an override of a closed month is refused with `month-closed`.
 */
export function setOverride(
  db: Database,
  change: OverrideChange,
  context: RuleEditContext,
  deps: OccurrencesRepositoryDeps,
): OccurrenceResult {
  const closed = closedMonthError(db, change.month, context);
  if (closed !== undefined) {
    return rejected(closed);
  }
  const target = writableItem(db, change.itemId);
  if ("error" in target) {
    return rejected(target.error);
  }
  const { item } = target;
  const stored = currentOverride(db, item.id, change.month);
  const override: OccurrenceOverride = {
    // The row keeps its own id; the id of a new row comes from `newId` when it is written.
    id: stored?.id ?? deps.newId(),
    itemType: item.itemType,
    itemId: item.id,
    month: change.month,
    ...(change.amount === undefined ? {} : { amount: change.amount }),
    ...(change.skipped === true ? { skipped: true } : {}),
    ...(change.note === undefined ? {} : { note: change.note }),
  };
  const inForce = itemInForce(item, change.month);
  const errors =
    inForce === undefined ? (["inactive-month"] as const) : validateOverride(override, inForce);
  if (errors.length > 0) {
    return rejected({ code: "invalid-override", errors });
  }
  writeOverride(db, override, deps);
  return { ok: true };
}

/**
 * Clears the override of one occurrence, so the month goes back to the rule amount. An item never loses its
 * payment row here, and clearing an unset occurrence is a no-op. Clearing in a closed month is refused.
 */
export function clearOverride(
  db: Database,
  itemId: string,
  month: YearMonth,
  context: RuleEditContext,
): OccurrenceResult {
  const closed = closedMonthError(db, month, context);
  if (closed !== undefined) {
    return rejected(closed);
  }
  const target = writableItem(db, itemId);
  if ("error" in target) {
    return rejected(target.error);
  }
  deleteOverride(db, target.item.id, month);
  return { ok: true };
}

/**
 * Marks one occurrence of an item as paid (expense) or received (income) by inserting its `payment_statuses` row.
 * Idempotent: a second call keeps the first `settled_at`. Payment status is per item and month and independent of
 * the rule, so an item with no occurrence in that month can be settled too: the row is what closing snapshots
 * (#85), and the month view decides what to show for it.
 */
export function settleOccurrence(
  db: Database,
  itemId: string,
  month: YearMonth,
  context: RuleEditContext,
  deps: OccurrencesRepositoryDeps,
): OccurrenceResult {
  const closed = closedMonthError(db, month, context);
  if (closed !== undefined) {
    return rejected(closed);
  }
  const target = writableItem(db, itemId);
  if ("error" in target) {
    return rejected(target.error);
  }
  db.insert(schema.paymentStatuses)
    .values({ itemId: target.item.id, month, settledAt: new Date(deps.now()) })
    .onConflictDoNothing()
    .run();
  return { ok: true };
}

/**
 * Marks one occurrence as not paid or not received by deleting its `payment_statuses` row. Idempotent: unsetting
 * an unsettled occurrence is a no-op. A skipped occurrence keeps its row until it is unset here (#5).
 */
export function unsettleOccurrence(
  db: Database,
  itemId: string,
  month: YearMonth,
  context: RuleEditContext,
): OccurrenceResult {
  const closed = closedMonthError(db, month, context);
  if (closed !== undefined) {
    return rejected(closed);
  }
  const target = writableItem(db, itemId);
  if ("error" in target) {
    return rejected(target.error);
  }
  db.delete(schema.paymentStatuses)
    .where(
      and(
        eq(schema.paymentStatuses.itemId, target.item.id),
        eq(schema.paymentStatuses.month, month),
      ),
    )
    .run();
  return { ok: true };
}

/** Every month an override part of a plan writes or deletes, in the order the plan lists them. */
function planOverrideMonths(plan: RuleEditPlan): YearMonth[] {
  const overrides = [...plan.upsertOverrides, ...plan.orphanedOverrides, ...plan.resetOverrides];
  return [...new Set(overrides.map((override) => override.month))];
}

/**
 * What the overrides of a plan must not do before anything is written: belong to another item, or not be overrides
 * at all. `planRuleEdit` already checked them against the item before the edit, so only these two are rechecked:
 * its `only-month` plan is valid against the versions this plan does not change.
 */
function planOverrideError(
  itemId: string,
  itemType: ItemType,
  plan: RuleEditPlan,
): OccurrenceErrorCode | undefined {
  const overrides = [...plan.upsertOverrides, ...plan.orphanedOverrides, ...plan.resetOverrides];
  const foreign = overrides.find(
    (override) => override.itemId !== itemId || override.itemType !== itemType,
  );
  if (foreign !== undefined) {
    return { code: "invalid-override", errors: ["item-mismatch"] };
  }
  const damaged = plan.upsertOverrides.find(
    (override) => validateStoredOverride(override).length > 0,
  );
  return damaged === undefined
    ? undefined
    : { code: "invalid-override", errors: validateStoredOverride(damaged) };
}

/**
 * Writes a whole core `RuleEditPlan` (#80) in one transaction: the rule versions exactly as #81 applies them, the
 * plan's `upsertOverrides` UPSERTed on `(item_id, month)`, and its `orphanedOverrides` and `resetOverrides` deleted
 * (#40 Q4). `keptOverrides` are left untouched: an override of a later month keeps its own amount or skip unless
 * the plan resets it (#40 Q5). Payment rows are never written or deleted by a plan: an edit changes the rule, not
 * what was paid. When any part of the plan is refused, or a write fails, nothing is written.
 *
 * A plan that touches a closed month is refused with `month-closed`, including its deletes: overrides and payment
 * statuses of a closed month are immutable (docs/domain/month-closing.md). The version part keeps #81's checks;
 * core's `planRuleEdit` is what refuses an edit that would change a closed month.
 */
export function applyRulePlan(
  db: Database,
  itemId: string,
  plan: RuleEditPlan,
  context: RuleEditContext,
  deps: OccurrencesRepositoryDeps,
): OccurrenceResult {
  const target = writableItem(db, itemId);
  if ("error" in target) {
    return rejected(target.error);
  }
  const { item, row } = target;
  const overrideError = planOverrideError(itemId, item.itemType, plan);
  if (overrideError !== undefined) {
    return rejected(overrideError);
  }
  for (const month of planOverrideMonths(plan)) {
    const closed = closedMonthError(db, month, context);
    if (closed !== undefined) {
      return rejected(closed);
    }
  }
  const versionError = ruleVersionPlanError(db, row, plan);
  if (versionError !== undefined) {
    return rejected(versionError);
  }
  db.transaction((tx) => {
    writeRuleVersions(tx, row, plan, deps);
    for (const override of plan.upsertOverrides) {
      writeOverride(tx, override, deps);
    }
    for (const override of [...plan.orphanedOverrides, ...plan.resetOverrides]) {
      deleteOverride(tx, override.itemId, override.month);
    }
  });
  return { ok: true };
}
