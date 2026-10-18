import { type MinorUnits, sumMinorUnits } from "./money";
import {
  isActiveInMonth,
  occurrencesInRange,
  type Schedule,
  scheduleFromLegacy,
} from "./recurrence";
import { toYearMonth, type YearMonth } from "./year-month";

export type ItemType = "expense" | "income";

/** The fields of a budget item (expense or income) that decide its occurrences. */
export interface ScheduledItem {
  readonly id: string;
  readonly itemType: ItemType;
  readonly amount: MinorUnits;
  readonly schedule: Schedule;
}

/**
 * A change of one occurrence of an item in one month: a different `amount`, or `skipped`. At most one override
 * exists per `(itemType, itemId, month)`. Overrides never change other months; "from this month on" is a change of
 * the item's rule (rule versioning, #80), not an override.
 */
export interface OccurrenceOverride {
  readonly id: string;
  readonly itemType: ItemType;
  readonly itemId: string;
  readonly month: YearMonth;
  readonly amount?: MinorUnits;
  readonly skipped?: boolean;
  readonly note?: string;
}

/** An effective occurrence of an item in a month, after applying its override (if any). */
export interface ResolvedOccurrence<T extends ScheduledItem> {
  readonly item: T;
  readonly month: YearMonth;
  readonly day?: number;
  readonly amount: MinorUnits;
  readonly override?: OccurrenceOverride;
}

export type OverrideErrorCode = "empty-override" | "skipped-with-amount" | "inactive-month";

const keyOf = (itemType: ItemType, itemId: string, month: YearMonth): string =>
  JSON.stringify([itemType, itemId, month]);

/** Validation for user input; returns error codes for the UI to translate (empty when the override is valid). */
export function validateOverride(
  override: OccurrenceOverride,
  item: ScheduledItem,
): OverrideErrorCode[] {
  const errors: OverrideErrorCode[] = [];
  if (override.amount === undefined && override.skipped !== true) {
    errors.push("empty-override");
  }
  if (override.amount !== undefined && override.skipped === true) {
    errors.push("skipped-with-amount");
  }
  if (!isActiveInMonth(item.schedule, override.month)) {
    errors.push("inactive-month");
  }
  return errors;
}

/**
 * The effective occurrences of `items` in `month`: overridden amounts applied, skipped occurrences removed.
 * Items are matched to overrides by `(itemType, itemId)` only, never by name. Overrides for a month in which the
 * item has no occurrence, or for an unknown item, are ignored (they can be left over after a rule change).
 * Throws a `RangeError` when two overrides share `(itemType, itemId, month)`.
 */
export function resolveOccurrences<T extends ScheduledItem>(
  items: readonly T[],
  overrides: readonly OccurrenceOverride[],
  month: YearMonth,
): ResolvedOccurrence<T>[] {
  const byKey = new Map<string, OccurrenceOverride>();
  for (const override of overrides) {
    const key = keyOf(override.itemType, override.itemId, override.month);
    if (byKey.has(key)) {
      throw new RangeError(`Duplicate override for ${key}`);
    }
    byKey.set(key, override);
  }

  const resolved: ResolvedOccurrence<T>[] = [];
  for (const item of items) {
    for (const occurrence of occurrencesInRange(item.schedule, month, month)) {
      const override = byKey.get(keyOf(item.itemType, item.id, month));
      if (override?.skipped === true) {
        continue;
      }
      resolved.push({
        item,
        ...occurrence,
        amount: override?.amount ?? item.amount,
        ...(override === undefined ? {} : { override }),
      });
    }
  }
  return resolved;
}

/** A legacy expense or income (`alimek/budget-lens`) with its amount already converted to minor units. */
export interface LegacyOverrideCandidate {
  readonly id: string;
  readonly name: string;
  readonly amount: MinorUnits;
  readonly type: "recurring" | "one-time";
  readonly frequency?: "monthly" | "quarterly" | "yearly";
  readonly startMonth?: number;
  readonly targetMonth?: string;
}

export interface LegacyOverrideMigration<T extends LegacyOverrideCandidate> {
  /** The items to import: everything except the legacy override items that became override records. */
  readonly items: T[];
  readonly overrides: OccurrenceOverride[];
}

/** Legacy marks an override with this suffix in the item name (Polish legacy data, matched only during import). */
const LEGACY_OVERRIDE_SUFFIX = " (nadpisanie)";

/**
 * Converts legacy name-based overrides – a one-time item `"<name> (nadpisanie)"` in `targetMonth` – into override
 * records, keeping the legacy month totals. For each override month, every recurring item named `<name>` that legacy
 * shows in that month is overridden: the first one (in input order) gets the sum of the override amounts, any other
 * same-name item is skipped (legacy hid them all). An override item that matches no recurring item stays a regular
 * one-time item, as legacy counts it. Only this import matches by name.
 */
export function overridesFromLegacy<T extends LegacyOverrideCandidate>(
  legacyItems: readonly T[],
  itemType: ItemType,
  createId: () => string,
): LegacyOverrideMigration<T> {
  const groups = new Map<string, { name: string; month: YearMonth; sources: T[] }>();
  for (const item of legacyItems) {
    if (
      item.type !== "one-time" ||
      item.targetMonth === undefined ||
      !item.name.includes(LEGACY_OVERRIDE_SUFFIX)
    ) {
      continue;
    }
    const month = toYearMonth(item.targetMonth);
    const name = item.name.replace(LEGACY_OVERRIDE_SUFFIX, "");
    const key = JSON.stringify([name, month]);
    const group = groups.get(key) ?? { name, month, sources: [] };
    group.sources.push(item);
    groups.set(key, group);
  }

  const consumed = new Set<T>();
  const overrides: OccurrenceOverride[] = [];
  for (const { name, month, sources } of groups.values()) {
    // Passing the override month as the start keeps exactly the legacy calendar check for that month.
    const targets = legacyItems.filter((item) => {
      const schedule = item.type === "recurring" ? scheduleFromLegacy(item, month) : null;
      return item.name === name && schedule !== null && isActiveInMonth(schedule, month);
    });
    if (targets.length === 0) {
      continue;
    }
    const amount = sumMinorUnits(sources.map((source) => source.amount));
    targets.forEach((target, index) => {
      overrides.push({
        id: createId(),
        itemType,
        itemId: target.id,
        month,
        ...(index === 0 ? { amount } : { skipped: true }),
      });
    });
    for (const source of sources) {
      consumed.add(source);
    }
  }

  return { items: legacyItems.filter((item) => !consumed.has(item)), overrides };
}
