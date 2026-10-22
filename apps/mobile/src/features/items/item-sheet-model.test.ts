// The decisions behind the item sheet (#82): what its reads mean, which notice the plan carries, and which copy
// and test ID each state shows. The planning itself is core's; this is only what the sheet renders from it.
import {
  DEFAULT_SETTINGS,
  type Language,
  type OccurrenceOverride,
  type RuleEditPlan,
  type Settings,
  toMinorUnits,
  toYearMonth,
  type YearMonth,
} from "@budget-lens/core";
import type { ItemsRead, StoredItem } from "@budget-lens/db";
import { describe, expect, it } from "vitest";
import type { ActiveMonth } from "@/db/use-active-month";
import type { LiveRead } from "@/db/use-live-read";
import {
  archivesItem,
  type SheetReads,
  saveAction,
  scheduledNotice,
  scheduledNoticeCopy,
  sheetAnnouncement,
  sheetModel,
  titleKey,
} from "./item-sheet-model";

const activeMonth = toYearMonth("2026-10");
const baseCurrency = DEFAULT_SETTINGS.baseCurrency;

/** A read that landed. */
const ready = <T>(value: T): LiveRead<T> => ({ status: "ready", value });

const month = (over: Partial<ActiveMonth> = {}): ActiveMonth => ({
  month: activeMonth,
  stored: activeMonth,
  status: "ready",
  reload: () => {},
  ...over,
});

const storedItem = (id: string, currency = baseCurrency, sortOrder = 0): StoredItem => ({
  id,
  itemType: "expense",
  currency,
  name: id,
  note: null,
  sortOrder,
  archivedAt: null,
  versions: [],
});

const itemsRead = (items: readonly StoredItem[]): ItemsRead => ({
  items,
  invalidItems: [],
});

const settings = (base = baseCurrency): Settings => ({ ...DEFAULT_SETTINGS, baseCurrency: base });

/** The reads of a sheet that is ready to show a form. */
const reads = (over: Partial<SheetReads> = {}): SheetReads => ({
  month: month(),
  settings: ready(settings()),
  items: ready(itemsRead([])),
  overrides: ready({ overrides: [] }),
  itemId: undefined,
  lang: "en" as Language,
  ...over,
});

const plan = (over: Partial<RuleEditPlan> = {}): RuleEditPlan => ({
  upsertVersions: [],
  deleteVersions: [],
  upsertOverrides: [],
  orphanedOverrides: [],
  keptOverrides: [],
  resetOverrides: [],
  notices: [],
  ...over,
});

const override = (month: YearMonth): OccurrenceOverride => ({
  id: `override-${month}`,
  itemType: "expense",
  itemId: "rent",
  month,
  amount: toMinorUnits(230),
});

describe("the sheet's reads", () => {
  it("waits for every read and reports the one the user has to hear about first", () => {
    // Arrange: the items read is still pending, and the settings read failed.
    const pending = sheetModel(reads({ items: { status: "loading", value: undefined } }));
    const failed = sheetModel(reads({ settings: { status: "error", value: undefined } }));

    // Act & Assert
    expect(pending).toEqual({ kind: "pending", status: "loading" });
    expect(failed).toEqual({ kind: "pending", status: "error" });
  });

  it("stays pending while there is no month to anchor the form to", () => {
    // Arrange
    const noMonth = sheetModel(reads({ month: month({ month: undefined }) }));

    // Act & Assert: a ready read with no `months` row is neither a form nor an error.
    expect(noMonth).toEqual({ kind: "pending", status: "ready" });
  });

  it("says an item that vanished from under an open sheet is gone", () => {
    // Arrange
    const readsWithoutItem = reads({ itemId: "rent", items: ready(itemsRead([])) });

    // Act & Assert
    expect(sheetModel(readsWithoutItem)).toEqual({ kind: "missing" });
  });

  it("builds the form from the stored month, the base currency and the list behind it", () => {
    // Arrange: two EUR items and one PLN one, so EUR is the currency items use the most.
    const model = sheetModel(
      reads({
        itemId: "rent",
        month: month({ month: activeMonth, stored: undefined }),
        items: ready(
          itemsRead([
            storedItem("rent"),
            storedItem("bills", "EUR", 4),
            storedItem("car", "EUR", 7),
          ]),
        ),
      }),
    );

    // Act
    if (model.kind !== "form") throw new Error("expected the form");

    // Assert: no stored month means nothing may be planned, and the new item sorts behind the last one.
    expect(model.item?.id).toBe("rent");
    expect(model.storedMonth).toBeUndefined();
    expect(model.baseCurrency).toBe(baseCurrency);
    expect(model.usedCurrencies).toEqual(["EUR", "PLN"]);
    expect(model.nextSortOrder).toBe(8);
    expect(model.key).toBe(`rent|${activeMonth}|none|${baseCurrency}|en`);
  });

  it("names a create by what the form was built from, so another item rebuilds it", () => {
    // Arrange
    const first = sheetModel(reads({ lang: "en" }));
    const polish = sheetModel(reads({ lang: "pl" }));

    // Act
    const keys = [first, polish].map((model) => (model.kind === "form" ? model.key : model.kind));

    // Assert
    expect(keys).toEqual([
      `new|${activeMonth}|${activeMonth}|${baseCurrency}|en`,
      `new|${activeMonth}|${activeMonth}|${baseCurrency}|pl`,
    ]);
  });
});

describe("the notices of the live dry run", () => {
  it("reads the scheduled change off the plan, kept or replaced", () => {
    // Arrange
    const later = toYearMonth("2027-03");

    // Act & Assert
    expect(
      scheduledNotice(plan({ notices: [{ code: "scheduled-change-kept", month: later }] })),
    ).toEqual({
      month: later,
      kept: true,
    });
    expect(
      scheduledNotice(plan({ notices: [{ code: "scheduled-change-replaced", month: later }] })),
    ).toEqual({ month: later, kept: false });
    expect(scheduledNotice(plan())).toBeUndefined();
  });

  it("says when saving leaves the item with no months, which archives it (#81)", () => {
    // Act & Assert
    expect(archivesItem(plan({ notices: [{ code: "no-versions-left" }] }))).toBe(true);
    expect(archivesItem(plan())).toBe(false);
  });

  it("offers replace for a kept change, and undo once replace is chosen (#64, decision 3)", () => {
    const later = toYearMonth("2027-03");
    const kept = { month: later, kept: true };

    // Act
    const before = scheduledNoticeCopy(kept, false);
    const after = scheduledNoticeCopy(kept, true);

    // Assert
    expect(before).toEqual({
      titleKey: "notice.scheduledKept.title",
      bodyKey: "notice.scheduledKept.body",
      actionKey: "notice.scheduledKept.replace",
      actionTestID: "item-notice-scheduled-replace",
    });
    expect(after.actionKey).toBe("notice.scheduledReplaced.keep");
    expect(after.actionTestID).toBe("item-notice-scheduled-keep");
  });

  it("announces the scheduled change first, then the months that keep their own amount", () => {
    const later = toYearMonth("2027-03");
    const notice = { month: later, kept: true };

    // Act & Assert
    expect(sheetAnnouncement(plan(), notice)).toEqual({ kind: "scheduled", notice });
    expect(sheetAnnouncement(plan({ keptOverrides: [override(later)] }), undefined)).toEqual({
      kind: "kept",
      count: 1,
    });
    expect(sheetAnnouncement(plan(), undefined)).toEqual({ kind: "silent" });
  });
});

describe("the sheet's copy", () => {
  it('titles a read-only item just "Item"', () => {
    // Act & Assert
    expect(titleKey(false, false)).toBe("form.titleNew");
    expect(titleKey(true, false)).toBe("form.titleEdit");
    expect(titleKey(true, true)).toBe("form.titleView");
  });

  it("adds while creating and saves while editing", () => {
    // Act & Assert
    expect(saveAction(false)).toEqual({ labelKey: "form.add", testID: "item-add" });
    expect(saveAction(true)).toEqual({ labelKey: "form.save", testID: "item-save" });
  });
});
