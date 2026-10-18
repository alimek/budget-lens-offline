import { isMinorUnits, type MinorUnits } from "./money";
import { isActiveInMonth, occurrencesInRange, type Schedule, validateSchedule } from "./recurrence";
import { isYearMonth, type YearMonth } from "./year-month";

export type ItemType = "expense" | "income";

/** The fields of a budget item (expense or income) that decide its occurrences. */
export interface ScheduledItem {
  readonly id: string;
  readonly itemType: ItemType;
  readonly amount: MinorUnits;
  readonly schedule: Schedule;
}

/**
 * A change of one occurrence of a recurring item in one month: a different `amount` (≥ 0), or `skipped`. At most
 * one override exists per `(itemType, itemId, month)`. Overrides never change other months; "from this month on" is
 * a change of the item's rule (rule versioning, #80), not an override.
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

export type OverrideErrorCode =
  | "invalid-override"
  | "invalid-id"
  | "invalid-item-type"
  | "invalid-item-id"
  | "invalid-month"
  | "invalid-amount"
  | "invalid-skipped"
  | "invalid-note"
  | "empty-override"
  | "skipped-with-amount"
  | "duplicate-override"
  | "item-mismatch"
  | "one-time-item"
  | "invalid-schedule"
  | "inactive-month";

/** A stored override that `resolveOccurrences` left out, with the reasons. */
export interface RejectedOverride {
  readonly override: unknown;
  readonly errors: readonly OverrideErrorCode[];
}

/** The result of `resolveOccurrences` for one month. */
export interface ResolvedMonth<T extends ScheduledItem> {
  readonly occurrences: readonly ResolvedOccurrence<T>[];
  /** Invalid or duplicate overrides; the same for every month of the same input. */
  readonly rejectedOverrides: readonly RejectedOverride[];
  /** Items left out because their schedule is invalid (see `validateSchedule`). */
  readonly invalidItems: readonly T[];
}

/**
 * An override that no longer matches an occurrence: its item is unknown, is a one-time item, or has no occurrence in
 * that month.
 */
export interface OrphanedOverride {
  readonly override: OccurrenceOverride;
  readonly reason: "unknown-item" | "no-occurrence" | "one-time-item";
}

/** Override fields as they may come from storage or a backup: the static types are not trusted at runtime. */
type UntrustedOverride = { readonly [Field in keyof OccurrenceOverride]?: unknown };

/** `null` (a nullable SQLite column) counts as an absent optional field. */
const isAbsent = (value: unknown): value is null | undefined =>
  value === undefined || value === null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isMonth = (value: unknown): value is YearMonth =>
  typeof value === "string" && isYearMonth(value);

const FIELD_CHECKS: readonly (readonly [
  OverrideErrorCode,
  (override: UntrustedOverride) => boolean,
])[] = [
  ["invalid-id", ({ id }) => isNonEmptyString(id)],
  ["invalid-item-type", ({ itemType }) => itemType === "expense" || itemType === "income"],
  ["invalid-item-id", ({ itemId }) => isNonEmptyString(itemId)],
  ["invalid-month", ({ month }) => isMonth(month)],
  [
    "invalid-amount",
    ({ amount }) =>
      isAbsent(amount) || (typeof amount === "number" && isMinorUnits(amount) && amount >= 0),
  ],
  ["invalid-skipped", ({ skipped }) => isAbsent(skipped) || typeof skipped === "boolean"],
  ["invalid-note", ({ note }) => isAbsent(note) || typeof note === "string"],
];

function shapeErrors({ amount, skipped }: UntrustedOverride): OverrideErrorCode[] {
  if (isAbsent(amount)) {
    return skipped === true ? [] : ["empty-override"];
  }
  return skipped === true ? ["skipped-with-amount"] : [];
}

/**
 * Validates an override loaded from storage or a backup: every field is checked at runtime and a wrong type is an
 * error code, never a thrown `TypeError`. `null` optional fields count as absent. Returns error codes (empty when
 * the override is valid).
 */
export function validateStoredOverride(override: unknown): OverrideErrorCode[] {
  if (typeof override !== "object" || override === null) {
    return ["invalid-override"];
  }
  const untrusted: UntrustedOverride = override;
  const fieldErrors = FIELD_CHECKS.filter(([, isValid]) => !isValid(untrusted)).map(
    ([code]) => code,
  );
  return [...fieldErrors, ...shapeErrors(untrusted)];
}

function itemErrors(override: OccurrenceOverride, item: ScheduledItem): OverrideErrorCode[] {
  const mismatch = override.itemType !== item.itemType || override.itemId !== item.id;
  const errors: OverrideErrorCode[] = mismatch ? ["item-mismatch"] : [];
  if (validateSchedule(item.schedule).length > 0) {
    errors.push("invalid-schedule");
  } else if (item.schedule.kind === "one-time") {
    errors.push("one-time-item");
  } else if (isMonth(override.month) && !isActiveInMonth(item.schedule, override.month)) {
    errors.push("inactive-month");
  }
  return errors;
}

/**
 * Validation for user input; returns error codes for the UI to translate (empty when the override is valid).
 * Includes the checks of `validateStoredOverride`, and that the override belongs to `item`, a recurring item that
 * has an occurrence in the override month. Never throws, also for an item with an invalid schedule.
 */
export function validateOverride(
  override: OccurrenceOverride,
  item: ScheduledItem,
): OverrideErrorCode[] {
  return [...validateStoredOverride(override), ...itemErrors(override, item)];
}

const keyOf = (itemType: ItemType, itemId: string, month: YearMonth): string =>
  JSON.stringify([itemType, itemId, month]);

/** A copy without `null` optional fields and without fields the model does not have. */
function normalized({
  id,
  itemType,
  itemId,
  month,
  amount,
  skipped,
  note,
}: OccurrenceOverride): OccurrenceOverride {
  return {
    id,
    itemType,
    itemId,
    month,
    ...(isAbsent(amount) ? {} : { amount }),
    ...(skipped === true ? { skipped } : {}),
    ...(isAbsent(note) ? {} : { note }),
  };
}

const itemKeyOf = (itemType: ItemType, itemId: string): string =>
  JSON.stringify([itemType, itemId]);

/** Whether `item` has a valid one-time schedule, so overrides of it are rejected. */
const isOneTimeItem = (item: ScheduledItem | undefined): boolean =>
  item !== undefined &&
  validateSchedule(item.schedule).length === 0 &&
  item.schedule.kind === "one-time";

/**
 * Valid overrides by key; invalid ones, every copy of a duplicated key and overrides of one-time items are
 * rejected.
 */
function acceptOverrides(
  overrides: readonly OccurrenceOverride[],
  itemsByKey: ReadonlyMap<string, ScheduledItem>,
) {
  const rejected: RejectedOverride[] = [];
  const groups = new Map<string, OccurrenceOverride[]>();
  for (const override of overrides) {
    const errors = validateStoredOverride(override);
    if (errors.length > 0) {
      rejected.push({ override, errors });
      continue;
    }
    const key = keyOf(override.itemType, override.itemId, override.month);
    const group = groups.get(key) ?? [];
    group.push(override);
    groups.set(key, group);
  }
  const byKey = new Map<string, OccurrenceOverride>();
  for (const [key, [only, ...others]] of groups) {
    if (only !== undefined && others.length === 0) {
      if (isOneTimeItem(itemsByKey.get(itemKeyOf(only.itemType, only.itemId)))) {
        rejected.push({ override: only, errors: ["one-time-item"] });
      } else {
        byKey.set(key, normalized(only));
      }
    } else {
      rejected.push(
        ...[only, ...others].map((override) => ({
          override,
          errors: ["duplicate-override" as const],
        })),
      );
    }
  }
  return { byKey, rejected };
}

const itemsByItemKey = (items: readonly ScheduledItem[]): ReadonlyMap<string, ScheduledItem> =>
  new Map(items.map((item) => [itemKeyOf(item.itemType, item.id), item]));

/**
 * The effective occurrences of `items` in `month`: overridden amounts applied, skipped occurrences removed, in item
 * order. Items are matched to overrides by `(itemType, itemId)` only, never by name. Overrides for a month in which
 * the item has no occurrence, or for an unknown item, are ignored (see `findOrphanedOverrides`).
 *
 * Bad stored data never breaks the month: an override that fails `validateStoredOverride`, shares
 * `(itemType, itemId, month)` with another one (all copies), or belongs to a one-time item (`one-time-item`) is left
 * out and reported in `rejectedOverrides`; an item with an invalid schedule is left out and reported in
 * `invalidItems`.
 */
export function resolveOccurrences<T extends ScheduledItem>(
  items: readonly T[],
  overrides: readonly OccurrenceOverride[],
  month: YearMonth,
): ResolvedMonth<T> {
  const { byKey, rejected } = acceptOverrides(overrides, itemsByItemKey(items));
  const occurrences: ResolvedOccurrence<T>[] = [];
  const invalidItems: T[] = [];
  for (const item of items) {
    if (validateSchedule(item.schedule).length > 0) {
      invalidItems.push(item);
      continue;
    }
    const override = byKey.get(keyOf(item.itemType, item.id, month));
    if (override?.skipped === true) {
      continue;
    }
    for (const occurrence of occurrencesInRange(item.schedule, month, month)) {
      occurrences.push({
        item,
        ...occurrence,
        amount: override?.amount ?? item.amount,
        ...(override === undefined ? {} : { override }),
      });
    }
  }
  return { occurrences, rejectedOverrides: rejected, invalidItems };
}

/**
 * Valid overrides that `resolveOccurrences` does not apply: the item is unknown (e.g. deleted), is a one-time item
 * (e.g. after a rule change from recurring to one-time), or has no occurrence in the override month (e.g. after a
 * new end month, anchor or interval). Edit flows use it to warn before a rule change
 * drops overrides; loading can count them. Invalid overrides and items with an invalid schedule are not reported
 * here (`resolveOccurrences` reports them).
 */
export function findOrphanedOverrides(
  items: readonly ScheduledItem[],
  overrides: readonly OccurrenceOverride[],
): readonly OrphanedOverride[] {
  const itemsByKey = itemsByItemKey(items);
  return overrides.flatMap((override): OrphanedOverride[] => {
    if (validateStoredOverride(override).length > 0) {
      return [];
    }
    const item = itemsByKey.get(itemKeyOf(override.itemType, override.itemId));
    if (item === undefined) {
      return [{ override, reason: "unknown-item" }];
    }
    if (isOneTimeItem(item)) {
      return [{ override, reason: "one-time-item" }];
    }
    const hasOccurrence =
      validateSchedule(item.schedule).length > 0 || isActiveInMonth(item.schedule, override.month);
    return hasOccurrence ? [] : [{ override, reason: "no-occurrence" }];
  });
}
