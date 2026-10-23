// The item form (#82) as pure functions: the state the sheet holds, what makes it valid, and how it maps onto
// what the data layer writes. Nothing here touches React, the database or a clock: the active month and the
// stored item arrive as arguments, so the whole save decision is testable and the sheet only renders it.
// The recurrence and version rules themselves stay in core (`planRuleEdit`); this file only decides *what edit
// the form is asking for*.
import {
  addMonths,
  type CurrencyCode,
  type ItemType,
  type Language,
  MAX_INTERVAL_MONTHS,
  type MinorUnits,
  monthsBetween,
  type Occurrence,
  type OccurrenceOverride,
  occurrencesInRange,
  planRuleEdit,
  type RuleEdit,
  type RuleEditContext,
  type RuleEditPlan,
  type RuleEditResult,
  type RuleVersion,
  type Schedule,
  type VersionedItem,
  versionInForce,
  type YearMonth,
} from "@budget-lens/core";
import type { NewItem, StoredItem } from "@budget-lens/db";
import { formatAmountNumber } from "../../ui/amount";
import {
  type AmountInputErrorKey,
  type AmountInputResult,
  validateAmountInput,
} from "../../ui/amount-input";

/** The "Repeats" options of the picker (#63). The presets are only shortcuts for an interval; the engine knows N. */
export type RepeatPreset =
  | "one-time"
  | "monthly"
  | "every-2"
  | "quarterly"
  | "every-6"
  | "yearly"
  | "custom";

/** Every preset in picker order, the order of the #63 handoff. */
export const REPEAT_PRESETS: readonly RepeatPreset[] = [
  "one-time",
  "monthly",
  "every-2",
  "quarterly",
  "every-6",
  "yearly",
  "custom",
];

/** The interval a preset stands for; `custom` carries its own `intervalMonths`. */
const PRESET_INTERVAL: Record<Exclude<RepeatPreset, "one-time" | "custom">, number> = {
  monthly: 1,
  "every-2": 2,
  quarterly: 3,
  "every-6": 6,
  yearly: 12,
};

/** "Every N months" as the picker shows a stored item: the preset for 1/2/3/6/12, Custom for anything else. */
export function repeatPresetFor(intervalMonths: number): RepeatPreset {
  const found = (Object.entries(PRESET_INTERVAL) as [RepeatPreset, number][]).find(
    ([, interval]) => interval === intervalMonths,
  );
  return found === undefined ? "custom" : found[0];
}

/** The whole form of the sheet, in the shape the controls hold it. */
export interface ItemFormState {
  /** Fixed after creation (#40): a picker on create, a read-only row when editing. */
  readonly kind: ItemType;
  readonly name: string;
  /** What is typed in the amount field; parsed with the currency's exponent, never a float. */
  readonly amountText: string;
  /** Fixed after creation (#82): editable only while creating. */
  readonly currency: CurrencyCode;
  readonly repeat: RepeatPreset;
  /** Only used by `repeat === "custom"`; 2–{@link MAX_INTERVAL_MONTHS}. */
  readonly intervalMonths: number;
  /** The recurring anchor, or the single month of a one-time item. */
  readonly firstMonth: YearMonth;
  /** 0 is "No specific day"; 1–31 the day, clamped to the shorter months by the engine. */
  readonly dayOfMonth: number;
  /** Recurring only. */
  readonly ends: boolean;
  /** Only used when `ends`; the schedule's `endMonth`. */
  readonly lastMonth: YearMonth;
  /** Recurring edits only: the month the change starts from (#64). */
  readonly appliesFrom: YearMonth;
}

/** What the form is missing or gets wrong. A name, an interval and a last month are codes of the `items`
namespace; an amount keeps its own key from #61, which lives in the shared `translation` namespace. */
export type ItemNameError = "errors.nameRequired";
export type ItemIntervalError = "errors.interval";
export type ItemLastMonthError = "errors.endBeforeStart";
export type ItemAmountError = "errors.amountZero" | AmountInputErrorKey;

/** What the form is missing or gets wrong, as translation keys and nothing else. */
export interface ItemFormErrors {
  readonly name: ItemNameError | undefined;
  readonly amount: ItemAmountError | undefined;
  readonly interval: ItemIntervalError | undefined;
  readonly lastMonth: ItemLastMonthError | undefined;
}

/** An error-free form: what a field is handed before the first save attempt (#63: validate on Add, then live). */
export const NO_FORM_ERRORS: ItemFormErrors = {
  name: undefined,
  amount: undefined,
  interval: undefined,
  lastMonth: undefined,
};

/** How many fields the error summary of #63 counts. */
export function countFormErrors(errors: ItemFormErrors): number {
  return [errors.name, errors.amount, errors.interval, errors.lastMonth].filter(
    (error) => error !== undefined,
  ).length;
}

/**
 * The validation of #63, in order: a name, an amount the currency can hold and that is greater than 0
 * (#63, decision 3), an interval inside 1–120, and a last month that is not before the first. The amount keeps
 * the `amountInput.*` key of `validateAmountInput` (namespace `translation`), everything else is a code of the
 * `items` namespace; codes and parameters only, never a message.
 */
export function itemFormErrors(
  state: ItemFormState,
  amount: AmountInputResult = validateAmountInput(state.amountText, state.currency),
): ItemFormErrors {
  const amountError = !amount.ok
    ? amount.errorKey
    : amount.value <= 0
      ? "errors.amountZero"
      : undefined;
  return {
    name: state.name.trim() === "" ? "errors.nameRequired" : undefined,
    amount: amountError,
    interval:
      state.repeat === "custom" && !isInterval(state.intervalMonths)
        ? "errors.interval"
        : undefined,
    lastMonth:
      state.repeat !== "one-time" && state.ends && isBeforeFirstMonth(state)
        ? "errors.endBeforeStart"
        : undefined,
  };
}

/** Whether the form can be saved at all: every validation code is clear. */
function isFormValid(errors: ItemFormErrors): boolean {
  return countFormErrors(errors) === 0;
}

function isInterval(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_INTERVAL_MONTHS;
}

function isBeforeFirstMonth(state: ItemFormState): boolean {
  return monthsBetween(state.firstMonth, state.lastMonth) < 0;
}

/** The interval the form asks for: a preset's, or the custom one typed in the stepper. */
function formIntervalMonths(state: ItemFormState): number {
  if (state.repeat === "custom") return state.intervalMonths;
  if (state.repeat === "one-time") return 1;
  return PRESET_INTERVAL[state.repeat];
}

/** The day of month, `0` meaning "No specific day" (absent from the schedule). */
function formDayOfMonth(state: ItemFormState): { readonly dayOfMonth?: number } {
  return state.dayOfMonth === 0 ? {} : { dayOfMonth: state.dayOfMonth };
}

/** Whether the "shorter months use their last day" hint belongs under the day picker (#63). */
export function showsDayClampHint(state: ItemFormState): boolean {
  return state.dayOfMonth >= 29;
}

/**
 * The schedule the form describes, or `undefined` while it is not a schedule yet: a custom interval outside
 * 1–120 or a last month before the first month has no meaning for the engine, and the sheet keeps the preview
 * away rather than showing one built from a broken rule.
 */
export function formSchedule(state: ItemFormState): Schedule | undefined {
  const day = formDayOfMonth(state);
  const intervalMonths = formIntervalMonths(state);
  if (state.repeat === "one-time") {
    return { kind: "one-time", month: state.firstMonth, ...day };
  }
  if (!isInterval(intervalMonths)) return undefined;
  const end = state.ends ? (isBeforeFirstMonth(state) ? undefined : state.lastMonth) : undefined;
  return {
    kind: "recurring",
    intervalMonths,
    anchor: state.firstMonth,
    ...day,
    ...(end === undefined ? {} : { endMonth: end }),
  };
}

/** A form that is worth saving: nothing missing, and a schedule the engine can resolve. */
export function isFormSubmittable(state: ItemFormState): boolean {
  return isFormValid(itemFormErrors(state)) && formSchedule(state) !== undefined;
}

/**
 * Whether a patch leaves the form as it was. A native field hands back its own text when it gains or loses
 * focus, and that repeat is not something the user changed: only a different value counts (#82).
 */
export function formUnchanged(state: ItemFormState, patch: Partial<ItemFormState>): boolean {
  return Object.entries(patch).every(([key, value]) => state[key as keyof ItemFormState] === value);
}

/** The amount of the form in minor units, or `undefined` while the field does not hold one. */
export function formAmount(state: ItemFormState): MinorUnits | undefined {
  const amount = validateAmountInput(state.amountText, state.currency);
  return amount.ok && amount.value > 0 ? amount.value : undefined;
}

/**
 * What a saved create writes: one item with its first version (#63, "Data model mapping"). `id` and the
 * timestamps stay with the caller, because the repository takes them as injected deps.
 */
export function formToNewItem(
  state: ItemFormState,
  id: string,
  sortOrder: number,
): NewItem | undefined {
  const amount = formAmount(state);
  const schedule = formSchedule(state);
  if (amount === undefined || schedule === undefined) return undefined;
  return {
    id,
    kind: state.kind,
    name: state.name.trim(),
    currency: state.currency,
    sortOrder,
    versions: [{ effectiveFrom: state.firstMonth, amount, schedule }],
  };
}

/**
 * What a saved edit asks core to plan (#64): `change-from` at the picked month for a recurring item, or
 * `fix-everywhere` for a one-time item edited in place. The one-time patch is the item's own month only; the
 * recurring one carries the whole schedule, so "Applies from" replaces the rule from that month on and keeps
 * the anchor's rhythm.
 */
export function formToRuleEdit(
  state: ItemFormState,
  options: { readonly replaceScheduled: boolean; readonly resetKeptOverrides: boolean },
): RuleEdit | undefined {
  const amount = formAmount(state);
  const schedule = formSchedule(state);
  if (amount === undefined || schedule === undefined) return undefined;
  const patch = { amount, schedule };
  if (schedule.kind === "one-time") {
    return { kind: "fix-everywhere", patch };
  }
  return {
    kind: "change-from",
    from: state.appliesFrom,
    patch,
    replaceScheduled: options.replaceScheduled === true,
    resetKeptOverrides: options.resetKeptOverrides === true,
  };
}

/**
 * The dry run behind the live notices and behind Save: the stored item plus the overrides of *that* item fed
 * into core's planner with the stored active month. `readOverrides` answers for every item, so the sheet keeps
 * only the rows of the one it is editing (#83); `rejectedOverrides` are reported, never planned.
 */
export function planFormEdit(
  item: VersionedItem,
  overrides: readonly OccurrenceOverride[],
  state: ItemFormState,
  context: RuleEditContext,
  options: {
    readonly replaceScheduled?: boolean;
    readonly resetKeptOverrides?: boolean;
  } = {},
): RuleEditResult | undefined {
  const edit = formToRuleEdit(state, {
    replaceScheduled: options.replaceScheduled === true,
    resetKeptOverrides: options.resetKeptOverrides === true,
  });
  if (edit === undefined) return undefined;
  return planRuleEdit({ item, overrides: overridesFor(item, overrides) }, edit, context);
}

/** Overrides are keyed by `(itemType, itemId, month)`; the read returns every item's, the form wants one's. */
export function overridesFor(
  item: VersionedItem,
  overrides: readonly OccurrenceOverride[],
): readonly OccurrenceOverride[] {
  return overrides.filter(
    (override) => override.itemId === item.id && override.itemType === item.itemType,
  );
}

/**
 * The "Applies from" default (#82): the active month, or the item's first month when the item only starts
 * later. Closed months can never be picked, so the list never starts before the active month.
 */
export function appliesFromDefault(item: StoredItem, activeMonth: YearMonth): YearMonth {
  const first = item.versions[0]?.effectiveFrom;
  return first === undefined || monthsBetween(activeMonth, first) <= 0 ? activeMonth : first;
}

/**
 * The months a picker offers: `count` of them from `from` on. The Applies-from and first-month pickers both ask
 * for 36 (#63 decision 2: the active month through active month + 35), which is also three years of previews.
 */
export function monthOptions(from: YearMonth, count = APPLIES_FROM_MONTHS): YearMonth[] {
  return Array.from({ length: count }, (_, index) => addMonths(from, index));
}

/** How many months "Applies from" and "First month" list: the chosen month plus 35 (#63, decision 2). */
export const APPLIES_FROM_MONTHS = 36;

/** Ten years of "Last month" options from the first month (#63). */
export const LAST_MONTHS = 121;

/**
 * The first-month options of an edit: the stored anchor when the item started before the active month (its
 * rhythm stays visible and selectable), and otherwise the active month onwards. Closed months are never added
 * on their own; only the value the item already has can reach behind the active month.
 */
export function firstMonthOptions(
  activeMonth: YearMonth,
  stored: YearMonth | undefined,
): YearMonth[] {
  if (stored === undefined || monthsBetween(activeMonth, stored) >= 0) {
    return monthOptions(activeMonth);
  }
  const behind = Math.abs(monthsBetween(activeMonth, stored));
  return monthOptions(stored, behind + APPLIES_FROM_MONTHS);
}

/**
 * The preview of #63: the next three occurrences of the form's schedule, from the month the form is anchored to
 * and three years ahead — the same `occurrencesInRange` the forecast and the month view resolve with, so the
 * sentence can never disagree with the engine (#82's acceptance criterion). A schedule the engine rejects has no
 * preview at all.
 */
export function formPreview(state: ItemFormState, activeMonth: YearMonth): readonly Occurrence[] {
  const schedule = formSchedule(state);
  if (schedule === undefined) return [];
  return occurrencesInRange(schedule, activeMonth, addMonths(activeMonth, 36)).slice(0, 3);
}

/** An occurrence as the day the preview names: the schedule's day, or the first of the month without one. */
export function occurrenceDay(occurrence: Occurrence): {
  readonly month: YearMonth;
  readonly dayOfMonth: number;
} {
  return { month: occurrence.month, dayOfMonth: occurrence.day ?? 1 };
}

/** The rule version the form edits: core's version in force in the month the form shows. */
function formVersionInForce(item: StoredItem, month: YearMonth): RuleVersion | undefined {
  return versionInForce(item.versions, month);
}

/** The currencies of the picker (#61, decision 4): base first, then the ones items use, then the rest A–Z. */
export function currencyOrder(
  base: CurrencyCode,
  all: readonly CurrencyCode[],
  used: readonly CurrencyCode[],
): CurrencyCode[] {
  const seen = new Set<CurrencyCode>([base]);
  const ordered = [base];
  for (const code of used) {
    if (!seen.has(code) && all.includes(code)) {
      seen.add(code);
      ordered.push(code);
    }
  }
  for (const code of [...all].sort()) {
    if (!seen.has(code)) {
      seen.add(code);
      ordered.push(code);
    }
  }
  return ordered;
}

/**
 * The form as it opens (#63): a create starts on the active month with the base currency and a plain monthly
 * rule; an edit reads the version the sheet is editing – the one in force at the month "Applies from" will
 * default to – and shows its amount, rhythm, anchor, day and end.
 */
export function initialForm(options: {
  readonly item?: StoredItem | undefined;
  readonly activeMonth: YearMonth;
  readonly baseCurrency: CurrencyCode;
  readonly lang: Language;
  /** The type a create opens with: the last one used in this session (#63). Ignored when editing. */
  readonly kind?: ItemType;
}): ItemFormState {
  const { item, activeMonth, baseCurrency, lang, kind = "expense" } = options;
  if (item === undefined) return createForm(activeMonth, baseCurrency, kind);
  return editForm(item, activeMonth, lang);
}

/** The empty create form: the active month, the base currency, a monthly rule and no day of month (#63). */
function createForm(
  activeMonth: YearMonth,
  baseCurrency: CurrencyCode,
  kind: ItemType,
): ItemFormState {
  return {
    kind,
    name: "",
    amountText: "",
    currency: baseCurrency,
    repeat: "monthly",
    intervalMonths: 1,
    firstMonth: activeMonth,
    dayOfMonth: 0,
    ends: false,
    lastMonth: addMonths(activeMonth, DEFAULT_LAST_MONTH_OFFSET),
    appliesFrom: activeMonth,
  };
}

/**
 * The edit form of a stored item, read off the version in force at the month the change starts from. Amounts
 * come back through {@link formatAmountNumber}, so the field shows the value the way the app language writes it.
 */
function editForm(item: StoredItem, activeMonth: YearMonth, lang: Language): ItemFormState {
  const from = appliesFromDefault(item, activeMonth);
  const version = formVersionInForce(item, from) ?? item.versions[0];
  const schedule = version?.schedule;
  const start = scheduleStart(schedule, activeMonth);
  return {
    kind: item.itemType,
    name: item.name,
    amountText: editAmountText(version, item.currency, lang),
    currency: item.currency,
    repeat: repeatPresetOf(schedule),
    intervalMonths: intervalOf(schedule),
    firstMonth: start,
    dayOfMonth: dayOf(schedule),
    ends: endsOf(schedule),
    lastMonth: lastMonthOf(schedule, start),
    appliesFrom: from,
  };
}

/** The amount of the version being edited, written the way the app language writes it (#61, decision 2). */
function editAmountText(
  version: RuleVersion | undefined,
  currency: CurrencyCode,
  lang: Language,
): string {
  return version === undefined ? "" : formatAmountNumber(version.amount, { lang, currency });
}

/** The interval the form shows: the stored one, or 1 for a rule that has none. */
function intervalOf(schedule: Schedule | undefined): number {
  return schedule?.kind === "recurring" ? schedule.intervalMonths : 1;
}

/** The day of month the form shows: the stored one, or "No specific day". */
function dayOf(schedule: Schedule | undefined): number {
  return schedule?.dayOfMonth ?? 0;
}

/** Whether the "Ends" toggle is on: the stored rule has an end month. */
function endsOf(schedule: Schedule | undefined): boolean {
  return schedule?.kind === "recurring" && schedule.endMonth !== undefined;
}

/** The "Repeats" preset a stored schedule reads as; an item with no version opens on monthly. */
function repeatPresetOf(schedule: Schedule | undefined): RepeatPreset {
  if (schedule === undefined) return "monthly";
  if (schedule.kind === "one-time") return "one-time";
  return repeatPresetFor(schedule.intervalMonths);
}

/** The anchor of a stored schedule: its anchor or own month, or the active month when there is no schedule. */
function scheduleStart(schedule: Schedule | undefined, activeMonth: YearMonth): YearMonth {
  if (schedule === undefined) return activeMonth;
  return schedule.kind === "one-time" ? schedule.month : schedule.anchor;
}

/** The stored end month, or ten years past the start as the "Last month" default (#63). */
function lastMonthOf(schedule: Schedule | undefined, start: YearMonth): YearMonth {
  const stored = schedule?.kind === "recurring" ? schedule.endMonth : undefined;
  return stored === undefined ? addMonths(start, DEFAULT_LAST_MONTH_OFFSET) : stored;
}

/** How far ahead the "Last month" picker defaults: ten years, matching {@link LAST_MONTHS}. */
const DEFAULT_LAST_MONTH_OFFSET = 120;

/**
 * The live dry run behind the notices (#64): an edit plans on every change, but only against a *stored* active
 * month, only while the form is worth planning, and never in a read-only sheet. A create has nothing to plan.
 */
export function liveDryRun(options: {
  readonly item: StoredItem | undefined;
  readonly overrides: readonly OccurrenceOverride[];
  readonly state: ItemFormState;
  /** The stored active month; nothing is planned against the calendar fallback (#82's planning rule). */
  readonly storedMonth: YearMonth | undefined;
  readonly readOnly: boolean;
  readonly replaceScheduled: boolean;
  readonly resetKeptOverrides: boolean;
}): RuleEditPlan | undefined {
  const { item, overrides, state, storedMonth, readOnly, replaceScheduled, resetKeptOverrides } =
    options;
  if (readOnly || item === undefined || storedMonth === undefined) return undefined;
  const planned = planFormEdit(
    item,
    overrides,
    state,
    { activeMonth: storedMonth },
    {
      replaceScheduled,
      resetKeptOverrides,
    },
  );
  if (planned === undefined || planned.ok === false) return undefined;
  return planned.plan;
}

/**
 * Whether the sheet is read-only (#64): a one-time item whose own month is already closed can no longer be
 * changed, so the form shows its values as text and offers only Done.
 */
export function isFormReadOnly(state: ItemFormState, activeMonth: YearMonth): boolean {
  if (state.repeat !== "one-time") return false;
  return monthsBetween(state.firstMonth, activeMonth) > 0;
}

/**
 * Whether the sheet shows its values as text (#64): the closed one-time item above, or a form that a save
 * already found to be closed while the user was typing in it.
 */
export function sheetReadOnly(
  item: StoredItem | undefined,
  state: ItemFormState,
  activeMonth: YearMonth,
  locked: boolean,
): boolean {
  return locked || (item !== undefined && isFormReadOnly(state, activeMonth));
}
