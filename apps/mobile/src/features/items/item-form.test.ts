// The item form (#82): what it accepts, the edit it asks core for, and what that edit plans. The planning itself
// is core's (`planRuleEdit`, tested in `packages/core`); these tests pin the form's mapping onto it.
import {
  type CurrencyCode,
  type MinorUnits,
  type OccurrenceOverride,
  type RuleVersion,
  toYearMonth,
  type YearMonth,
} from "@budget-lens/core";
import type { StoredItem } from "@budget-lens/db";
import { describe, expect, it } from "vitest";
import {
  APPLIES_FROM_MONTHS,
  appliesFromDefault,
  countFormErrors,
  currencyOrder,
  formAmount,
  formPreview,
  formSchedule,
  formToNewItem,
  formToRuleEdit,
  formUnchanged,
  type ItemFormState,
  initialForm,
  isFormReadOnly,
  itemFormErrors,
  monthOptions,
  overridesFor,
  planFormEdit,
  repeatPresetFor,
  showsDayClampHint,
} from "./item-form";

const activeMonth = toYearMonth("2026-10");
const amount = 320_000 as MinorUnits;

/** The form as the sheet holds it: monthly, no day, no end, starting and applying from October 2026. */
const state = (over: Partial<ItemFormState> = {}): ItemFormState => ({
  kind: "expense",
  name: "Rent",
  amountText: "3200",
  currency: "PLN",
  repeat: "monthly",
  intervalMonths: 4,
  firstMonth: activeMonth,
  dayOfMonth: 0,
  ends: false,
  lastMonth: activeMonth,
  appliesFrom: activeMonth,
  ...over,
});

const version = (
  effectiveFrom: YearMonth,
  value: MinorUnits,
  over: { readonly dayOfMonth?: number; readonly endMonth?: YearMonth } = {},
): RuleVersion => ({
  effectiveFrom,
  amount: value,
  schedule: {
    kind: "recurring",
    intervalMonths: 1,
    anchor: toYearMonth("2026-01"),
    ...over,
  },
});

const storedItem = (versions: readonly RuleVersion[]): StoredItem => ({
  id: "rent",
  itemType: "expense",
  currency: "PLN",
  name: "Rent",
  note: null,
  sortOrder: 0,
  archivedAt: null,
  versions,
});

const override = (month: YearMonth, value: MinorUnits): OccurrenceOverride => ({
  id: `override-${month}`,
  itemType: "expense",
  itemId: "rent",
  month,
  amount: value,
});

describe("the amount field", () => {
  it("reads an amount in the currency's exponent as minor units", () => {
    // Act & Assert: PLN has two fraction digits, JPY none.
    expect(formAmount(state({ amountText: "12,5" }))).toBe(1250);
    expect(formAmount(state({ amountText: "1,000", currency: "JPY" as CurrencyCode }))).toBe(1000);
  });

  it("has no amount when the exponent rejects the text or the amount is zero", () => {
    // Assert: `12,5` is not a JPY amount at all, and 0 blocks saving (#63, decision 3).
    expect(
      formAmount(state({ amountText: "12,5", currency: "JPY" as CurrencyCode })),
    ).toBeUndefined();
    expect(formAmount(state({ amountText: "0" }))).toBeUndefined();
  });

  it("names the field each validation problem belongs to", () => {
    // Act
    const missing = itemFormErrors(state({ name: "  ", amountText: "" }));
    const zero = itemFormErrors(state({ amountText: "0" }));
    const jpy = itemFormErrors(state({ amountText: "12,5", currency: "JPY" as CurrencyCode }));

    // Assert
    expect(missing.name).toBe("errors.nameRequired");
    expect(missing.amount).toBe("amountInput.empty");
    expect(zero.amount).toBe("errors.amountZero");
    expect(jpy.amount).toBe("amountInput.noFractionDigits");
    expect(countFormErrors(zero)).toBe(1);
  });

  it("rejects a custom interval outside 1 to 120 and a last month before the first", () => {
    // Act
    const wide = itemFormErrors(state({ repeat: "custom", intervalMonths: 121 }));
    const ended = itemFormErrors(state({ ends: true, lastMonth: toYearMonth("2026-09") }));

    // Assert
    expect(wide.interval).toBe("errors.interval");
    expect(ended.lastMonth).toBe("errors.endBeforeStart");
    expect(itemFormErrors(state({ repeat: "custom", intervalMonths: 4 })).interval).toBeUndefined();
  });
});

describe("the recurrence picker", () => {
  it("shows a stored interval as its preset, and any other as Custom", () => {
    // Assert: the presets are only shortcuts for 1, 2, 3, 6 and 12 (#63).
    expect([1, 2, 3, 6, 12, 4, 24].map(repeatPresetFor)).toEqual([
      "monthly",
      "every-2",
      "quarterly",
      "every-6",
      "yearly",
      "custom",
      "custom",
    ]);
  });

  it("builds the schedule the engine knows from the form", () => {
    // Act & Assert
    expect(formSchedule(state({ repeat: "quarterly", dayOfMonth: 10 }))).toEqual({
      kind: "recurring",
      intervalMonths: 3,
      anchor: activeMonth,
      dayOfMonth: 10,
    });
    expect(formSchedule(state({ repeat: "one-time" }))).toEqual({
      kind: "one-time",
      month: activeMonth,
    });
    // An impossible rule has no schedule, so the form shows no preview rather than a wrong one.
    expect(formSchedule(state({ repeat: "custom", intervalMonths: 0 }))).toBeUndefined();
  });

  it("previews the next three occurrences from the engine itself", () => {
    // Act: every second month, on the 10th, from the active month.
    const preview = formPreview(state({ repeat: "every-2", dayOfMonth: 10 }), activeMonth);

    // Assert: `occurrencesInRange` decides, so the sentence cannot disagree with it.
    expect(preview.map((occurrence) => `${occurrence.month}-${occurrence.day}`)).toEqual([
      "2026-10-10",
      "2026-12-10",
      "2027-02-10",
    ]);
  });
});

describe("the currency list", () => {
  it("puts the base currency first, then the currencies items use, then the rest", () => {
    // Arrange
    const all = ["PLN", "EUR", "USD", "JPY", "AUD"] as CurrencyCode[];

    // Act
    const order = currencyOrder("PLN", all, ["USD", "EUR"]);

    // Assert: base, used (in the order of how much they are used), then the rest A–Z (#61, decision 4).
    expect(order).toEqual(["PLN", "USD", "EUR", "AUD", "JPY"]);
  });
});

describe("creating an item", () => {
  it("writes one item with its first version", () => {
    // Act
    const item = formToNewItem(state({ dayOfMonth: 10 }), "new-id", 3);

    // Assert
    expect(item).toEqual({
      id: "new-id",
      kind: "expense",
      name: "Rent",
      currency: "PLN",
      sortOrder: 3,
      versions: [
        {
          effectiveFrom: activeMonth,
          amount,
          schedule: { kind: "recurring", intervalMonths: 1, anchor: activeMonth, dayOfMonth: 10 },
        },
      ],
    });
  });

  it("writes nothing while the form has no amount", () => {
    // Act & Assert
    expect(formToNewItem(state({ amountText: "0" }), "new-id", 0)).toBeUndefined();
  });
});

describe("the Applies-from picker", () => {
  it("defaults to the active month, and to the item's first month when it starts later", () => {
    // Assert: a correction starts now; an item that only starts in March is corrected from March.
    expect(
      appliesFromDefault(storedItem([version(toYearMonth("2026-01"), amount)]), activeMonth),
    ).toBe(activeMonth);
    expect(
      appliesFromDefault(storedItem([version(toYearMonth("2027-03"), amount)]), activeMonth),
    ).toBe(toYearMonth("2027-03"));
  });

  it("offers the chosen month and the 35 after it, never a closed one", () => {
    // Act
    const options = monthOptions(toYearMonth("2027-03"));

    // Assert
    expect(options).toHaveLength(APPLIES_FROM_MONTHS);
    expect(options[0]).toBe(toYearMonth("2027-03"));
    expect(options.at(-1)).toBe(toYearMonth("2030-02"));
  });
});

describe("the form as it opens", () => {
  it("starts a create on the active month with the base currency and a monthly rule", () => {
    // Act
    const form = initialForm({
      activeMonth,
      baseCurrency: "EUR",
      lang: "pl",
    });

    // Assert
    expect(form).toMatchObject({
      kind: "expense",
      name: "",
      amountText: "",
      currency: "EUR",
      repeat: "monthly",
      firstMonth: activeMonth,
      appliesFrom: activeMonth,
      dayOfMonth: 0,
      ends: false,
    });
  });

  it("opens an edit on the version the sheet is editing", () => {
    // Arrange: a 320 PLN monthly rent with a day, and a 450 PLN change scheduled from March 2027.
    const item = storedItem([
      version(activeMonth, amount, { dayOfMonth: 10 }),
      version(toYearMonth("2027-03"), 450_00 as MinorUnits),
    ]);

    // Act
    const form = initialForm({ item, activeMonth, baseCurrency: "PLN", lang: "pl" });

    // Assert: the October version is the one in force, so its amount, rhythm, anchor and day are shown.
    expect(form.name).toBe("Rent");
    expect(form.amountText.replace(/[\s\u00a0\u202f]/g, "")).toBe("3200,00");
    expect(form.currency).toBe("PLN");
    expect(form.repeat).toBe("monthly");
    expect(form.firstMonth).toBe(toYearMonth("2026-01"));
    expect(form.dayOfMonth).toBe(10);
    expect(form.appliesFrom).toBe(activeMonth);
  });

  it("opens a one-time item on its own month, and only that item is read-only once the month is closed", () => {
    // Arrange
    const closed = storedItem([
      {
        effectiveFrom: toYearMonth("2026-05"),
        amount,
        schedule: { kind: "one-time", month: toYearMonth("2026-05") },
      },
    ]);
    const open = storedItem([
      { effectiveFrom: activeMonth, amount, schedule: { kind: "one-time", month: activeMonth } },
    ]);

    // Act
    const closedForm = initialForm({ item: closed, activeMonth, baseCurrency: "PLN", lang: "pl" });
    const openForm = initialForm({ item: open, activeMonth, baseCurrency: "PLN", lang: "pl" });

    // Assert
    expect(closedForm.repeat).toBe("one-time");
    expect(closedForm.firstMonth).toBe(toYearMonth("2026-05"));
    expect(isFormReadOnly(closedForm, activeMonth)).toBe(true);
    expect(isFormReadOnly(openForm, activeMonth)).toBe(false);
    // A recurring item is never read-only because of its own month: "Applies from" protects the past.
    expect(isFormReadOnly(state(), activeMonth)).toBe(false);
  });

  it("hints about the shorter months only for a day that can be clamped", () => {
    // Assert
    expect(showsDayClampHint(state({ dayOfMonth: 31 }))).toBe(true);
    expect(showsDayClampHint(state({ dayOfMonth: 28 }))).toBe(false);
  });

  it("treats a field repeating its own text as no change at all", () => {
    // Assert: the value the user moved on from is a change; the text a field hands back is not.
    expect(formUnchanged(state(), { amountText: "3500" })).toBe(false);
    expect(formUnchanged(state(), { amountText: "3200" })).toBe(true);
    expect(formUnchanged(state(), { dayOfMonth: 0 })).toBe(true);
    // An empty patch changes nothing either, so it is no reason to confirm leaving the form.
    expect(formUnchanged(state(), {})).toBe(true);
  });
});

describe("saving an edit", () => {
  it("asks for a change-from at the picked month", () => {
    // Act
    const edit = formToRuleEdit(
      state({ appliesFrom: toYearMonth("2027-01"), amountText: "2450" }),
      { replaceScheduled: false, resetKeptOverrides: false },
    );

    // Assert
    expect(edit).toEqual({
      kind: "change-from",
      from: toYearMonth("2027-01"),
      patch: {
        amount: 245_000 as MinorUnits,
        schedule: { kind: "recurring", intervalMonths: 1, anchor: activeMonth },
      },
      replaceScheduled: false,
      resetKeptOverrides: false,
    });
  });

  it("asks for fix-everywhere for a one-time item", () => {
    // Act
    const edit = formToRuleEdit(state({ repeat: "one-time" }), {
      replaceScheduled: false,
      resetKeptOverrides: false,
    });

    // Assert
    expect(edit?.kind).toBe("fix-everywhere");
  });

  it("leaves earlier months unchanged when editing from a later month", () => {
    // Arrange
    const item = storedItem([version(toYearMonth("2026-01"), amount)]);

    // Act
    const planned = plan(
      item,
      state({ appliesFrom: toYearMonth("2027-01"), amountText: "2450" }),
      [],
    );

    // Assert: one new version at the picked month, nothing deleted, and October still resolves the old amount.
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.plan.upsertVersions).toEqual([
      {
        effectiveFrom: toYearMonth("2027-01"),
        amount: 245_000 as MinorUnits,
        schedule: { kind: "recurring", intervalMonths: 1, anchor: activeMonth },
      },
    ]);
    expect(planned.plan.deleteVersions).toEqual([]);
    expect(planned.plan.notices).toEqual([]);
  });

  it("plans nothing when the form still holds the rule that is in force", () => {
    // Arrange: an item running since January at the amount and rhythm the form shows, edited in June under a
    // new name — the reviewer's case of #248.
    const item = storedItem([version(toYearMonth("2026-01"), amount)]);
    const renamed = state({
      name: "Flat rent",
      firstMonth: toYearMonth("2026-01"),
      appliesFrom: toYearMonth("2026-06"),
    });

    // Act
    const planned = planFormEdit(item, [], renamed, { activeMonth: toYearMonth("2026-06") });

    // Assert: a name is no part of a rule version, so nothing is planned: no `upsertVersions` at June, and no
    // notice of #64 to show for a change that was never asked for.
    expect(planned).toBeUndefined();
  });

  it("changes every month when editing from the first month with no closed history and no later version", () => {
    // Arrange: the item starts in the active month, so correcting it there is the whole rule.
    const item = storedItem([version(activeMonth, amount)]);

    // Act
    const planned = plan(item, state({ amountText: "2450" }), []);

    // Assert: the one version is replaced in place; earlier months never had this item.
    expect(planned.ok && planned.plan.upsertVersions.map((v) => v.effectiveFrom)).toEqual([
      activeMonth,
    ]);
    expect(planned.ok && planned.plan.deleteVersions).toEqual([]);
    expect(planned.ok && planned.plan.notices).toEqual([]);
  });

  it("keeps a later scheduled change and says so", () => {
    // Arrange
    const item = storedItem([
      version(activeMonth, amount),
      version(toYearMonth("2027-03"), 500_000 as MinorUnits),
    ]);

    // Act
    const planned = plan(item, state({ amountText: "2450" }), []);

    // Assert: the March version survives with its own amount, and the notice names it.
    expect(planned.ok && planned.plan.notices).toEqual([
      { code: "scheduled-change-kept", month: toYearMonth("2027-03") },
    ]);
    expect(planned.ok && planned.plan.deleteVersions).toEqual([]);
  });

  it("replaces the later scheduled change when the user chooses replace", () => {
    // Arrange
    const item = storedItem([
      version(activeMonth, amount),
      version(toYearMonth("2027-03"), 500_000 as MinorUnits),
    ]);

    // Act
    const planned = plan(item, state({ amountText: "2450" }), [], { replaceScheduled: true });

    // Assert: the scheduled version goes, and the notice changed with the choice.
    expect(planned.ok && planned.plan.deleteVersions).toEqual([toYearMonth("2027-03")]);
    expect(planned.ok && planned.plan.notices).toEqual([
      { code: "scheduled-change-replaced", month: toYearMonth("2027-03") },
    ]);
  });

  it("refuses to change an item whose month is closed", () => {
    // Arrange: the item has history in January, which is closed in October.
    const item = storedItem([version(toYearMonth("2026-01"), amount)]);

    // Act: the picker cannot offer January, and core refuses it anyway.
    const planned = plan(item, state({ appliesFrom: toYearMonth("2026-01") }), []);

    // Assert
    expect(planned.ok).toBe(false);
    if (planned.ok) return;
    expect(planned.error).toEqual({ code: "month-closed", month: toYearMonth("2026-01") });
  });

  it("keeps an override of a month the new rule still schedules, and resets it on request", () => {
    // Arrange
    const item = storedItem([version(activeMonth, amount)]);
    const overrides = [override(toYearMonth("2026-12"), 99_000 as MinorUnits)];

    // Act
    const kept = plan(item, state({ amountText: "2450" }), overrides);
    const reset = plan(item, state({ amountText: "2450" }), overrides, {
      resetKeptOverrides: true,
    });

    // Assert (#40 Q5): the month keeps its own amount unless the user turns the reset on.
    expect(kept.ok && kept.plan.keptOverrides.map((o) => o.month)).toEqual([
      toYearMonth("2026-12"),
    ]);
    expect(kept.ok && kept.plan.resetOverrides).toEqual([]);
    expect(reset.ok && reset.plan.keptOverrides).toEqual([]);
    expect(reset.ok && reset.plan.resetOverrides.map((o) => o.month)).toEqual([
      toYearMonth("2026-12"),
    ]);
  });

  it("plans only the overrides of the item it is editing", () => {
    // Arrange: `readOverrides` answers for every item; the sheet keeps its own rows only (#83).
    const item = storedItem([version(activeMonth, amount)]);
    const own = override(toYearMonth("2026-11"), 100 as MinorUnits);
    const foreign: OccurrenceOverride = { ...own, id: "x", itemId: "internet" };

    // Act
    const kept = overridesFor(item, [foreign, own]);

    // Assert
    expect(kept.map((row) => row.month)).toEqual([toYearMonth("2026-11")]);
    expect(overridesFor(item, [foreign])).toEqual([]);
  });
});

/** The dry run the sheet runs live; `planFormEdit` with no replace/reset flags unless the test asks for them. */
function plan(
  item: StoredItem,
  form: ItemFormState,
  overrides: readonly OccurrenceOverride[],
  options: {
    readonly replaceScheduled?: boolean;
    readonly resetKeptOverrides?: boolean;
  } = {},
) {
  const planned = planFormEdit(item, overrides, form, { activeMonth }, options);
  if (planned === undefined) throw new Error("the form asks for no edit");
  return planned;
}
