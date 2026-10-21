import type { CurrencyCode } from "./currency";
import { isMinorUnits, type MinorUnits } from "./money";
import {
  type ItemType,
  type OccurrenceOverride,
  type OverrideErrorCode,
  type RejectedOverride,
  type ResolvedOccurrence,
  resolveOccurrences,
  type ScheduledItem,
  validateOverride,
  validateStoredOverride,
} from "./occurrence-overrides";
import { occurrencesInRange, type Schedule, validateSchedule } from "./recurrence";
import { addMonths, isYearMonth, monthsBetween, type YearMonth } from "./year-month";

/**
 * The versioned fields of an item ("how much and when"), in force from `effectiveFrom` until the next version's
 * `effectiveFrom`. Inside that window the schedule decides the occurrence months; its anchor may be earlier than
 * `effectiveFrom`, which keeps the rhythm (quarterly since February stays February/May/August/November).
 */
export interface RuleVersion {
  readonly effectiveFrom: YearMonth;
  /** Minor units of the item's currency. The currency is fixed per item and is never part of a version. */
  readonly amount: MinorUnits;
  readonly schedule: Schedule;
}

/**
 * An item with all its rule versions, at most one per `effectiveFrom`. Item-level fields (name, note) are not
 * versioned; extra fields of `T` are carried into {@link ItemInForce}.
 */
export interface VersionedItem {
  readonly id: string;
  readonly itemType: ItemType;
  /**
   * ISO 4217 code of the item's currency: every `amount` of every version is in its minor units (#138).
   * Fixed when the item is created; a different currency means a new item
   * ([#81 owner decision](https://github.com/alimek/budget-lens-offline/issues/81#issuecomment-6276228839)).
   */
  readonly currency: CurrencyCode;
  readonly versions: readonly RuleVersion[];
}

/** The item as it is in one month: its item-level fields with the amount and schedule of the version in force. */
export type ItemInForce<T extends VersionedItem> = Omit<T, "versions"> & ScheduledItem;

export type RuleVersionErrorCode =
  | "invalid-versions"
  | "no-versions"
  | "invalid-effective-from"
  | "duplicate-effective-from"
  | "invalid-amount"
  | "invalid-schedule";

/** Version fields as they may come from storage: the static types are not trusted at runtime. */
type UntrustedVersion = { readonly [Field in keyof RuleVersion]?: unknown };

const validMonth = (month: unknown): month is YearMonth =>
  typeof month === "string" && isYearMonth(month);

function versionErrors(version: unknown): RuleVersionErrorCode[] {
  if (typeof version !== "object" || version === null) {
    return ["invalid-versions"];
  }
  const { effectiveFrom, amount, schedule }: UntrustedVersion = version;
  const errors: RuleVersionErrorCode[] = [];
  if (!validMonth(effectiveFrom)) {
    errors.push("invalid-effective-from");
  }
  if (typeof amount !== "number" || !isMinorUnits(amount) || amount < 0) {
    errors.push("invalid-amount");
  }
  if (validateSchedule(schedule as Schedule).length > 0) {
    errors.push("invalid-schedule");
  }
  return errors;
}

/**
 * Validates the versions of one item, also when loaded from storage: every field is checked at runtime and a wrong
 * type is an error code, never a thrown `TypeError`. An item needs at least one version, at most one per month.
 * Returns each error code once (empty when the versions are valid).
 */
export function validateRuleVersions(versions: readonly RuleVersion[]): RuleVersionErrorCode[] {
  if (!Array.isArray(versions)) {
    return ["invalid-versions"];
  }
  const errors = new Set<RuleVersionErrorCode>(versions.length === 0 ? ["no-versions"] : []);
  const months = new Set<YearMonth>();
  for (const version of versions as readonly unknown[]) {
    for (const error of versionErrors(version)) {
      errors.add(error);
    }
    const month = (version as UntrustedVersion | null)?.effectiveFrom;
    if (!validMonth(month)) continue;
    if (months.has(month)) {
      errors.add("duplicate-effective-from");
    }
    months.add(month);
  }
  return [...errors];
}

/** Versions in `effectiveFrom` order. */
const sorted = (versions: readonly RuleVersion[]): RuleVersion[] =>
  [...versions].sort((a, b) => monthsBetween(b.effectiveFrom, a.effectiveFrom));

/**
 * The version in force in `month`: the one with the greatest `effectiveFrom` ≤ `month`. `undefined` before the
 * first version, when the item does not exist yet. Expects valid versions (see {@link validateRuleVersions}).
 */
export function versionInForce(
  versions: readonly RuleVersion[],
  month: YearMonth,
): RuleVersion | undefined {
  return sorted(versions)
    .filter((version) => monthsBetween(version.effectiveFrom, month) >= 0)
    .at(-1);
}

/** The item in `month` (see {@link ItemInForce}), or `undefined` before its first version. Expects valid versions. */
export function itemInForce<T extends VersionedItem>(
  item: T,
  month: YearMonth,
): ItemInForce<T> | undefined {
  const { versions, ...fields } = item;
  const version = versionInForce(versions, month);
  return version === undefined
    ? undefined
    : {
        ...fields,
        id: item.id,
        itemType: item.itemType,
        amount: version.amount,
        schedule: version.schedule,
      };
}

/** The result of {@link resolveVersionedOccurrences} for one month. */
export interface ResolvedVersionedMonth<T extends VersionedItem> {
  readonly occurrences: readonly ResolvedOccurrence<ItemInForce<T>>[];
  /** Invalid or duplicate overrides; the same for every month of the same input. */
  readonly rejectedOverrides: readonly RejectedOverride[];
  /** Items left out because their versions are invalid (see {@link validateRuleVersions}). */
  readonly invalidItems: readonly T[];
}

/**
 * The effective occurrences of versioned `items` in `month`: each item uses the version in force in that month,
 * then `resolveOccurrences` (#5) applies the overrides, which stay keyed by `(itemType, itemId, month)` and do not
 * depend on versions. Items without a version in force yet have no occurrence.
 */
export function resolveVersionedOccurrences<T extends VersionedItem>(
  items: readonly T[],
  overrides: readonly OccurrenceOverride[],
  month: YearMonth,
): ResolvedVersionedMonth<T> {
  const invalidItems: T[] = [];
  const inForce: ItemInForce<T>[] = [];
  for (const item of items) {
    if (validateRuleVersions(item.versions).length > 0) {
      invalidItems.push(item);
      continue;
    }
    const current = itemInForce(item, month);
    if (current !== undefined) {
      inForce.push(current);
    }
  }
  const { occurrences, rejectedOverrides } = resolveOccurrences(inForce, overrides, month);
  return { occurrences, rejectedOverrides, invalidItems };
}

/** A version with the months of its window: from `effectiveFrom` to the month before the next version. */
interface VersionWindow {
  readonly version: RuleVersion;
  readonly last?: YearMonth;
}

function windows(versions: readonly RuleVersion[]): VersionWindow[] {
  return sorted(versions).map((version, index, all) => {
    const next = all[index + 1];
    return next === undefined ? { version } : { version, last: addMonths(next.effectiveFrom, -1) };
  });
}

/** The first month before `activeMonth` in which the version schedules an occurrence, if any. */
function firstClosedOccurrence(
  { version, last }: VersionWindow,
  activeMonth: YearMonth,
): YearMonth | undefined {
  const lastClosed = addMonths(activeMonth, -1);
  const to = last === undefined || monthsBetween(lastClosed, last) > 0 ? lastClosed : last;
  if (monthsBetween(version.effectiveFrom, to) < 0) {
    return undefined;
  }
  return occurrencesInRange(version.schedule, version.effectiveFrom, to)[0]?.month;
}

/** New values of versioned fields; a missing field keeps its current value. */
export interface RulePatch {
  readonly amount?: MinorUnits;
  readonly schedule?: Schedule;
}

/**
 * An edit of one item's rule, one per edit scope:
 * - `create` – a new item; its first version starts no earlier than the active month.
 * - `only-month` – "only this month": an occurrence override (#5), never a version.
 * - `change-from` – "from month M on": a version at M (the active month or later). Later scheduled versions are
 *   kept, unless `replaceScheduled` deletes them.
 * - `stop-from` – no occurrences from M on: `endMonth = M - 1` on the version in force, versions from M deleted.
 * - `edit-scheduled` / `cancel-scheduled` – change or delete a version that starts after the active month.
 * - `fix-everywhere` – change the version in force in place; only while no closed month uses it.
 *
 * `resetKeptOverrides` ("reset these months") deletes the overrides that would otherwise keep their own amount or
 * skip in months whose rule changes.
 */
export type RuleEdit = (
  | { readonly kind: "create"; readonly version: RuleVersion }
  | { readonly kind: "only-month"; readonly override: OccurrenceOverride }
  | {
      readonly kind: "change-from";
      readonly from: YearMonth;
      readonly patch: RulePatch;
      readonly replaceScheduled?: boolean;
    }
  | { readonly kind: "stop-from"; readonly from: YearMonth }
  | { readonly kind: "edit-scheduled"; readonly versionFrom: YearMonth; readonly patch: RulePatch }
  | { readonly kind: "cancel-scheduled"; readonly versionFrom: YearMonth }
  | { readonly kind: "fix-everywhere"; readonly patch: RulePatch }
) & { readonly resetKeptOverrides?: boolean };

/** The item before the edit, with its overrides (overrides of other items are ignored). */
export interface RuleEditState {
  readonly item: VersionedItem;
  readonly overrides: readonly OccurrenceOverride[];
}

/** The active month comes from the months table (status `active`), never from the clock. */
export interface RuleEditContext {
  readonly activeMonth: YearMonth;
}

export type RuleEditNotice =
  /** A later scheduled version stays in force from `month`; the UI offers to replace it. */
  | { readonly code: "scheduled-change-kept"; readonly month: YearMonth }
  /** A later scheduled version from `month` is deleted (`replaceScheduled`). */
  | { readonly code: "scheduled-change-replaced"; readonly month: YearMonth }
  /** The edit deletes every version: the item has no occurrence in any month. */
  | { readonly code: "no-versions-left" };

/**
 * What the database applies in one transaction (#81). Versions are keyed by `(itemId, effectiveFrom)` and
 * overrides by `(itemType, itemId, month)`; `orphanedOverrides` and `resetOverrides` are deleted.
 */
export interface RuleEditPlan {
  readonly upsertVersions: readonly RuleVersion[];
  /** `effectiveFrom` of the versions to delete. */
  readonly deleteVersions: readonly YearMonth[];
  readonly upsertOverrides: readonly OccurrenceOverride[];
  /** Overrides of months the new rule no longer schedules: listed for confirmation, then deleted. */
  readonly orphanedOverrides: readonly OccurrenceOverride[];
  /** Overrides that stay in months whose rule changes, keeping their own amount or skip. */
  readonly keptOverrides: readonly OccurrenceOverride[];
  /** The overrides that would be kept, deleted because of `resetKeptOverrides`. */
  readonly resetOverrides: readonly OccurrenceOverride[];
  readonly notices: readonly RuleEditNotice[];
}

export type RuleEditError =
  | { readonly code: "invalid-month" }
  | { readonly code: "invalid-item"; readonly errors: readonly RuleVersionErrorCode[] }
  | { readonly code: "invalid-rule"; readonly errors: readonly RuleVersionErrorCode[] }
  | { readonly code: "invalid-override"; readonly errors: readonly OverrideErrorCode[] }
  | { readonly code: "item-exists" }
  | { readonly code: "one-time-item" }
  | {
      readonly code:
        | "month-closed"
        | "closed-month-changed"
        | "version-used-by-closed-month"
        | "no-version-in-force"
        | "version-not-found"
        | "version-not-scheduled";
      readonly month: YearMonth;
    };

export type RuleEditResult =
  | { readonly ok: true; readonly plan: RuleEditPlan }
  | { readonly ok: false; readonly error: RuleEditError };

interface Draft {
  readonly versions: readonly RuleVersion[];
  readonly notices?: readonly RuleEditNotice[];
  readonly upsertOverrides?: readonly OccurrenceOverride[];
}

type DraftResult = { readonly ok: true; readonly draft: Draft } | RejectedEdit;
type RejectedEdit = { readonly ok: false; readonly error: RuleEditError };

const reject = (error: RuleEditError): RejectedEdit => ({ ok: false, error });

const isBefore = (month: YearMonth, other: YearMonth): boolean => monthsBetween(month, other) > 0;

const patched = (version: RuleVersion, { amount, schedule }: RulePatch): RuleVersion => ({
  effectiveFrom: version.effectiveFrom,
  amount: amount ?? version.amount,
  schedule: schedule ?? version.schedule,
});

/** Rejects an edit of `month` unless it is the active month or later. */
function openMonth(month: YearMonth, { activeMonth }: RuleEditContext): RejectedEdit | undefined {
  if (!validMonth(month)) return reject({ code: "invalid-month" });
  return isBefore(month, activeMonth) ? reject({ code: "month-closed", month }) : undefined;
}

function changeFrom(
  versions: readonly RuleVersion[],
  edit: Extract<RuleEdit, { kind: "change-from" }>,
): DraftResult {
  const { from, patch } = edit;
  const base = versionInForce(versions, from);
  if (base?.schedule.kind === "one-time") return reject({ code: "one-time-item" });
  const amount = patch.amount ?? base?.amount;
  const schedule = patch.schedule ?? base?.schedule;
  if (amount === undefined || schedule === undefined) {
    return reject({ code: "no-version-in-force", month: from });
  }
  const earlier = versions.filter((version) => isBefore(version.effectiveFrom, from));
  const later = sorted(versions).filter((version) => isBefore(from, version.effectiveFrom));
  const replace = edit.replaceScheduled === true;
  return {
    ok: true,
    draft: {
      versions: [...earlier, { effectiveFrom: from, amount, schedule }, ...(replace ? [] : later)],
      notices: later.map(({ effectiveFrom: month }) => ({
        code: replace ? "scheduled-change-replaced" : "scheduled-change-kept",
        month,
      })),
    },
  };
}

/**
 * Versions without occurrences from `from` on. The version in force in `from - 1` gets that end month; a version
 * without any occurrence left in its window is deleted and the version before it is ended instead.
 */
function stopVersions(versions: readonly RuleVersion[], from: YearMonth): RuleVersion[] {
  const remaining = sorted(versions).filter((version) => isBefore(version.effectiveFrom, from));
  const last = remaining.at(-1);
  if (last === undefined) return [];
  const lastMonth = addMonths(from, -1);
  if (occurrencesInRange(last.schedule, last.effectiveFrom, lastMonth).length === 0) {
    return stopVersions(remaining, last.effectiveFrom);
  }
  const { schedule } = last;
  if (
    schedule.kind === "one-time" ||
    (schedule.endMonth !== undefined && !isBefore(lastMonth, schedule.endMonth))
  ) {
    return remaining;
  }
  return [...remaining.slice(0, -1), { ...last, schedule: { ...schedule, endMonth: lastMonth } }];
}

function scheduledVersion(
  versions: readonly RuleVersion[],
  month: YearMonth,
  { activeMonth }: RuleEditContext,
): { readonly ok: true; readonly version: RuleVersion } | RejectedEdit {
  if (!validMonth(month)) return reject({ code: "invalid-month" });
  const version = versions.find(({ effectiveFrom }) => effectiveFrom === month);
  if (version === undefined) return reject({ code: "version-not-found", month });
  if (!isBefore(activeMonth, month)) return reject({ code: "version-not-scheduled", month });
  return { ok: true, version };
}

const withoutVersions = (
  before: readonly RuleVersion[],
  versions: readonly RuleVersion[],
): readonly RuleEditNotice[] =>
  before.length > 0 && versions.length === 0 ? [{ code: "no-versions-left" }] : [];

function fixEverywhere(
  versions: readonly RuleVersion[],
  patch: RulePatch,
  { activeMonth }: RuleEditContext,
): DraftResult {
  const all = windows(versions);
  const target =
    all.find(({ version }) => version === versionInForce(versions, activeMonth)) ?? all[0];
  if (target === undefined) return reject({ code: "no-version-in-force", month: activeMonth });
  const used = firstClosedOccurrence(target, activeMonth);
  if (used !== undefined) return reject({ code: "version-used-by-closed-month", month: used });
  const fixed = patched(target.version, patch);
  return {
    ok: true,
    draft: { versions: versions.map((version) => (version === target.version ? fixed : version)) },
  };
}

function onlyMonth(item: VersionedItem, override: OccurrenceOverride, context: RuleEditContext) {
  const closed = openMonth(override.month, context);
  if (closed !== undefined) return closed;
  const current = itemInForce(item, override.month);
  const errors: OverrideErrorCode[] =
    current === undefined ? ["inactive-month"] : validateOverride(override, current);
  if (errors.length > 0) return reject({ code: "invalid-override", errors });
  return { ok: true as const, draft: { versions: item.versions, upsertOverrides: [override] } };
}

const drafted = (draft: Draft): DraftResult => ({ ok: true, draft });

function create(
  versions: readonly RuleVersion[],
  version: RuleVersion,
  context: RuleEditContext,
): DraftResult {
  if (versions.length > 0) return reject({ code: "item-exists" });
  return openMonth(version.effectiveFrom, context) ?? drafted({ versions: [version] });
}

function stopFrom(
  versions: readonly RuleVersion[],
  from: YearMonth,
  context: RuleEditContext,
): DraftResult {
  const closed = openMonth(from, context);
  if (closed !== undefined) return closed;
  const stopped = stopVersions(versions, from);
  return drafted({ versions: stopped, notices: withoutVersions(versions, stopped) });
}

/** Edits a scheduled version with `patch`, or cancels it without one. */
function changeScheduled(
  versions: readonly RuleVersion[],
  versionFrom: YearMonth,
  patch: RulePatch | undefined,
  context: RuleEditContext,
): DraftResult {
  const found = scheduledVersion(versions, versionFrom, context);
  if (!found.ok) return found;
  if (patch === undefined) {
    const next = versions.filter((version) => version !== found.version);
    return drafted({ versions: next, notices: withoutVersions(versions, next) });
  }
  const edited = patched(found.version, patch);
  return drafted({
    versions: versions.map((version) => (version === found.version ? edited : version)),
  });
}

function draftEdit(item: VersionedItem, edit: RuleEdit, context: RuleEditContext): DraftResult {
  const { versions } = item;
  switch (edit.kind) {
    case "create":
      return create(versions, edit.version, context);
    case "only-month":
      return onlyMonth(item, edit.override, context);
    case "change-from":
      return openMonth(edit.from, context) ?? changeFrom(versions, edit);
    case "stop-from":
      return stopFrom(versions, edit.from, context);
    case "edit-scheduled":
      return changeScheduled(versions, edit.versionFrom, edit.patch, context);
    case "cancel-scheduled":
      return changeScheduled(versions, edit.versionFrom, undefined, context);
    case "fix-everywhere":
      return fixEverywhere(versions, edit.patch, context);
  }
}

/** The scheduled occurrence (before overrides) of the item in `month`, as a comparable key. */
function scheduledKey(versions: readonly RuleVersion[], month: YearMonth): string | undefined {
  const version = versionInForce(versions, month);
  const occurrence =
    version === undefined ? undefined : occurrencesInRange(version.schedule, month, month)[0];
  return occurrence === undefined || version === undefined
    ? undefined
    : JSON.stringify([version.amount, occurrence.day ?? null]);
}

/** Everything a closed month shows for the item: resolved occurrences and whether its override still applies. */
function closedMonthKey(
  item: VersionedItem,
  overrides: readonly OccurrenceOverride[],
  month: YearMonth,
): string {
  const resolved = resolveVersionedOccurrences([item], overrides, month).occurrences.map(
    ({ day, amount }) => [day ?? null, amount],
  );
  return JSON.stringify([resolved, scheduledKey(item.versions, month) !== undefined]);
}

/**
 * The closed-month invariant: an edit is accepted only if it changes the resolved occurrences of no closed month
 * (every month before the active month), including whether an override there still applies.
 */
function changedClosedMonth(
  before: VersionedItem,
  after: VersionedItem,
  overrides: readonly OccurrenceOverride[],
  { activeMonth }: RuleEditContext,
): YearMonth | undefined {
  const first = sorted([...before.versions, ...after.versions])[0]?.effectiveFrom;
  if (first === undefined) return undefined;
  for (let month = first; isBefore(month, activeMonth); month = addMonths(month, 1)) {
    if (closedMonthKey(before, overrides, month) !== closedMonthKey(after, overrides, month)) {
      return month;
    }
  }
  return undefined;
}

/** Overrides of open months, sorted by what the edit does to their month. */
function affectedOverrides(
  before: readonly RuleVersion[],
  after: readonly RuleVersion[],
  overrides: readonly OccurrenceOverride[],
  { activeMonth }: RuleEditContext,
) {
  const orphaned: OccurrenceOverride[] = [];
  const kept: OccurrenceOverride[] = [];
  for (const override of overrides) {
    if (isBefore(override.month, activeMonth)) continue;
    const was = scheduledKey(before, override.month);
    const is = scheduledKey(after, override.month);
    if (was !== undefined && is === undefined) orphaned.push(override);
    else if (is !== undefined && was !== is) kept.push(override);
  }
  return { orphaned, kept };
}

const versionKey = ({ effectiveFrom, amount, schedule }: RuleVersion): string =>
  JSON.stringify([
    effectiveFrom,
    amount,
    schedule.kind,
    schedule.kind === "one-time" ? schedule.month : [schedule.intervalMonths, schedule.anchor],
    schedule.dayOfMonth ?? null,
    schedule.kind === "recurring" ? (schedule.endMonth ?? null) : null,
  ]);

/**
 * Plans an edit of one item's rule (#40): the versions and overrides to write in one transaction, the overrides the
 * user confirms, and notices. Pure: the active month is passed in and nothing is written. An edit that would change
 * a closed month is rejected (`closed-month-changed` with the first such month), so past months keep their
 * occurrences after any edit. Error and notice codes are for the UI to translate.
 */
export function planRuleEdit(
  state: RuleEditState,
  edit: RuleEdit,
  context: RuleEditContext,
): RuleEditResult {
  if (!validMonth(context.activeMonth)) return reject({ code: "invalid-month" });
  const { item } = state;
  if (edit.kind !== "create") {
    const errors = validateRuleVersions(item.versions);
    if (errors.length > 0) return reject({ code: "invalid-item", errors });
  }
  const drafted = draftEdit(item, edit, context);
  if (!drafted.ok) return drafted;
  const { draft } = drafted;
  const after: VersionedItem = { ...item, versions: draft.versions };
  if (draft.versions.length > 0) {
    const errors = validateRuleVersions(draft.versions);
    if (errors.length > 0) return reject({ code: "invalid-rule", errors });
  }

  const overrides = state.overrides.filter(
    (override) =>
      validateStoredOverride(override).length === 0 &&
      override.itemType === item.itemType &&
      override.itemId === item.id,
  );
  const changed = changedClosedMonth(item, after, overrides, context);
  if (changed !== undefined) return reject({ code: "closed-month-changed", month: changed });

  const { orphaned, kept } = affectedOverrides(item.versions, draft.versions, overrides, context);
  const reset = edit.resetKeptOverrides === true;
  const beforeKeys = new Set(item.versions.map(versionKey));
  const afterMonths = new Set<string>(draft.versions.map(({ effectiveFrom }) => effectiveFrom));
  return {
    ok: true,
    plan: {
      upsertVersions: sorted(draft.versions).filter(
        (version) => !beforeKeys.has(versionKey(version)),
      ),
      deleteVersions: sorted(item.versions)
        .map(({ effectiveFrom }) => effectiveFrom)
        .filter((month) => !afterMonths.has(month)),
      upsertOverrides: draft.upsertOverrides ?? [],
      orphanedOverrides: orphaned,
      keptOverrides: reset ? [] : kept,
      resetOverrides: reset ? kept : [],
      notices: draft.notices ?? [],
    },
  };
}

const overrideKey = ({ itemType, itemId, month }: OccurrenceOverride): string =>
  JSON.stringify([itemType, itemId, month]);

/**
 * The state after the database applied `plan` (#81): versions upserted by `effectiveFrom` and deleted, overrides
 * upserted by `(itemType, itemId, month)` and the orphaned and reset ones deleted. Pure; for checks and live state.
 */
export function applyRuleEditPlan(state: RuleEditState, plan: RuleEditPlan): RuleEditState {
  const deleted = new Set<string>(plan.deleteVersions);
  const upserted = new Set<string>(plan.upsertVersions.map(({ effectiveFrom }) => effectiveFrom));
  const versions = state.item.versions
    .filter(({ effectiveFrom }) => !deleted.has(effectiveFrom) && !upserted.has(effectiveFrom))
    .concat(plan.upsertVersions);
  const removed = new Set(
    [...plan.orphanedOverrides, ...plan.resetOverrides, ...plan.upsertOverrides].map(overrideKey),
  );
  const overrides = state.overrides
    .filter((override) => !removed.has(overrideKey(override)))
    .concat(plan.upsertOverrides);
  return { item: { ...state.item, versions: sorted(versions) }, overrides };
}
