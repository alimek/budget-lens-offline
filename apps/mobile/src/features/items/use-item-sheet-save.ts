// The save of the item sheet (#82): what a press of "Add" or "Save" writes, and what it refuses to write. The
// decisions are the small pure functions here and in `item-sheet-model.ts`; the repositories do the rest. An edit
// that changes the rule goes through `applyRulePlan`, which checks everything and writes nothing when it refuses,
// so versions and one-off overrides can never diverge (#83); an edit that leaves the rule alone writes the name
// only. A name is not versioned, so it is always its own write afterwards.
import type { ItemType, OccurrenceOverride, RuleEditPlan, YearMonth } from "@budget-lens/core";
import {
  applyRulePlan,
  type BudgetDatabase,
  createItem,
  type StoredItem,
  updateItem,
} from "@budget-lens/db";
import { randomUUID } from "expo-crypto";
import { useState } from "react";
import { useDatabase } from "@/db/database-provider";
import { formToNewItem, type ItemFormState, isFormSubmittable, planFormEdit } from "./item-form";
import { type SaveFailure, type SaveOutcome, saveFailureOf } from "./item-sheet-model";

/** The clock and the new ids are injected; the repositories read no clock of their own (#81, #83). */
const deps = { now: () => Date.now(), newId: randomUUID };

/** What a new item opens as: the kind of the last one created in this session (#63). */
let sessionKind: ItemType = "expense";

/** The kind the next create form opens with. */
export function rememberedKind(): ItemType {
  return sessionKind;
}

const saveFailed: SaveOutcome = { kind: "failure", failure: { kind: "save-failed" } };

/** What the save writes from: the sheet's model, plus the two toggles of #64 and the new item's place. */
export interface SheetSaveInput {
  /** Absent while creating: a create is one write of the item with its first version. */
  readonly item: StoredItem | undefined;
  /** Every override in the database; `planFormEdit` keeps the editing item's rows (#83). */
  readonly overrides: readonly OccurrenceOverride[];
  /** Where a new item lands in the list's manual order. */
  readonly nextSortOrder: number;
  readonly replaceScheduled: boolean;
  readonly resetKeptOverrides: boolean;
}

export interface SheetSave {
  /** The refusal the sheet is showing, or none. */
  readonly failure: SaveFailure | undefined;
  /** Run the save against the stored active month; `blocked` when there is none to plan against. */
  readonly run: (
    storedMonth: YearMonth | undefined,
    form: ItemFormState,
    orphansConfirmed: boolean,
  ) => SaveOutcome;
  /** Close the refusal. */
  readonly acknowledge: () => void;
}

/** The save behind the sheet's main action, with the refusal it last reported. */
export function useItemSheetSave(input: SheetSaveInput): SheetSave {
  const db = useDatabase();
  const [failure, setFailure] = useState<SaveFailure | undefined>(undefined);
  return {
    failure,
    run: (storedMonth, form, orphansConfirmed) => {
      const outcome = writeSave(db, input, storedMonth, form, orphansConfirmed);
      if (outcome.kind === "failure") setFailure(outcome.failure);
      return outcome;
    },
    acknowledge: () => setFailure(undefined),
  };
}

/**
 * One press of the main action: nothing is planned or written without a stored active month (#82's planning
 * rule), an invalid form only shows its errors, and an edit whose orphaned changes are unconfirmed stops at the
 * confirmation of #40.
 */
function writeSave(
  db: BudgetDatabase,
  input: SheetSaveInput,
  storedMonth: YearMonth | undefined,
  form: ItemFormState,
  orphansConfirmed: boolean,
): SaveOutcome {
  if (storedMonth === undefined) return { kind: "blocked" };
  if (isFormSubmittable(form) === false) return { kind: "invalid" };
  if (input.item === undefined) return writeCreate(db, input, form);
  return writeEdit(db, input, storedMonth, form, orphansConfirmed);
}

/** A create is one write: the item with its first version (#63, "Data model mapping"). */
function writeCreate(db: BudgetDatabase, input: SheetSaveInput, form: ItemFormState): SaveOutcome {
  const item = formToNewItem(form, randomUUID(), input.nextSortOrder);
  if (item === undefined) return saveFailed;
  if (createItem(db, item, deps).ok === false) return saveFailed;
  sessionKind = form.kind;
  return { kind: "saved" };
}

/**
 * An edit plans first and only then writes. A form that asks for no rule change at all — the same amount and
 * schedule it already has — is only a name change, so it writes nothing but the name.
 */
function writeEdit(
  db: BudgetDatabase,
  input: SheetSaveInput,
  storedMonth: YearMonth,
  form: ItemFormState,
  orphansConfirmed: boolean,
): SaveOutcome {
  const item = input.item;
  if (item === undefined) return saveFailed;
  const planned = planFormEdit(
    item,
    input.overrides,
    form,
    { activeMonth: storedMonth },
    {
      replaceScheduled: input.replaceScheduled,
      resetKeptOverrides: input.resetKeptOverrides,
    },
  );
  if (planned === undefined) return writeName(db, item, form);
  if (planned.ok === false) {
    return { kind: "failure", failure: saveFailureOf(planned.error, form.repeat === "one-time") };
  }
  return writePlan(db, item, storedMonth, form, planned.plan, orphansConfirmed);
}

/**
 * The plan is written whole by `applyRulePlan`: it checks everything and writes nothing when it refuses, and in
 * one transaction it writes the versions, the overrides to keep, reset and orphan, and archives the item when the
 * plan leaves no versions (#81, #83). Orphaned one-off changes are confirmed by the user first (#40 Q4).
 */
function writePlan(
  db: BudgetDatabase,
  item: StoredItem,
  storedMonth: YearMonth,
  form: ItemFormState,
  plan: RuleEditPlan,
  orphansConfirmed: boolean,
): SaveOutcome {
  if (orphansConfirmed === false && plan.orphanedOverrides.length > 0) return { kind: "orphans" };
  const written = applyRulePlan(db, item.id, plan, { activeMonth: storedMonth }, deps);
  if (written.ok === false) {
    return { kind: "failure", failure: saveFailureOf(written.error, form.repeat === "one-time") };
  }
  return writeName(db, item, form);
}

/**
 * The item's name is not versioned, so a changed one is its own write next to the plan (#63). It sits outside
 * the plan's transaction, so its own refusal is reported like any other failed save: a name that did not land is
 * not a saved edit, even when the rule did (#248 round 1).
 */
function writeName(db: BudgetDatabase, item: StoredItem, form: ItemFormState): SaveOutcome {
  const name = form.name.trim();
  if (name === "" || name === item.name) return { kind: "saved" };
  if (updateItem(db, item.id, { name }, deps).ok === false) return saveFailed;
  return { kind: "saved" };
}
