import type { MinorUnits } from "./money";
import { isActiveInMonth, occurrencesInRange, type Schedule } from "./recurrence";
import type { YearMonth } from "./year-month";

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
