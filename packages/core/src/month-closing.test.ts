import { describe, expect, it } from "vitest";
import { toMinorUnits } from "./money";
import {
  type ActiveMonth,
  type BudgetMonth,
  buildClosedOccurrences,
  type CloseMonthInput,
  closeMonth,
  createInitialMonth,
  type PaymentStatus,
  updateBalance,
} from "./month-closing";
import {
  type OccurrenceOverride,
  resolveOccurrences,
  type ScheduledItem,
} from "./occurrence-overrides";
import { toYearMonth, type YearMonth } from "./year-month";

const december = toYearMonth("2026-12");
const january = toYearMonth("2027-01");
const money = toMinorUnits;
const active: ActiveMonth = Object.freeze({
  month: december,
  status: "active",
  openingBalance: money(100_000),
  closingBalance: money(120_000),
  totalIncome: money(0),
  totalExpenses: money(0),
  netChange: money(20_000),
});
const input: CloseMonthInput = {
  currentMonth: december,
  closingBalance: money(120_000),
  items: [],
  overrides: [],
  paymentStatuses: [],
};
const item = (id: string, itemType: "expense" | "income", amount: number): ScheduledItem => ({
  id,
  itemType,
  amount: money(amount),
  schedule: { kind: "recurring", anchor: december, intervalMonths: 1 },
});
const payment = (
  itemId: string,
  itemType: "expense" | "income",
  settled = true,
): PaymentStatus => ({
  itemId,
  itemType,
  month: december,
  settled,
});

describe("month closing", () => {
  it("stores effective totals and actual balance change, carrying December's balance into January", () => {
    const items: readonly ScheduledItem[] = [
      item("rent", "expense", 30_000),
      item("skip", "expense", 40_000),
      item("salary", "income", 90_000),
      { ...item("later", "income", 500), schedule: { kind: "one-time", month: january } },
    ];
    const overrides: OccurrenceOverride[] = [
      {
        id: "rent-adjustment",
        itemType: "expense",
        itemId: "rent",
        month: december,
        amount: money(35_000),
      },
      {
        id: "skip-adjustment",
        itemType: "expense",
        itemId: "skip",
        month: december,
        skipped: true,
      },
    ];

    const result = closeMonth([active], {
      ...input,
      items,
      overrides,
      paymentStatuses: [payment("rent", "expense"), payment("skip", "expense")],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.closed).toMatchObject({
      status: "closed",
      totalIncome: 90_000,
      totalExpenses: 35_000,
      netChange: 20_000,
      openingBalance: 100_000,
      closingBalance: 120_000,
    });
    expect(result.value.next).toEqual({
      month: january,
      status: "active",
      openingBalance: 120_000,
      closingBalance: 120_000,
      totalIncome: 0,
      totalExpenses: 0,
      netChange: 0,
    });
    expect(result.value.unpaid).toEqual([]);
    expect(result.value.unreceived.map((row) => row.itemId)).toEqual(["salary"]);
    expect(active.status).toBe("active");
  });

  it("lists only unpaid/unreceived effective occurrences, matching payment by type, id and month", () => {
    const items: readonly ScheduledItem[] = [
      item("same", "expense", 100),
      item("same", "income", 200),
      item("pending", "expense", 0),
      item("future", "income", 400),
    ];
    const paymentStatuses = [
      payment("same", "expense"),
      payment("pending", "expense", false),
      { ...payment("same", "income"), month: january },
    ];

    const result = closeMonth([active], { ...input, items, paymentStatuses });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.unpaid.map((row) => row.itemId)).toEqual(["pending"]);
    expect(result.value.unreceived.map((row) => row.itemId)).toEqual(["same", "future"]);
    expect(result.value.closed.closedOccurrences).toHaveLength(4);
  });

  it.each([
    { months: [], error: "no-active-month" },
    { months: [active], patch: { currentMonth: "2026-13" as YearMonth }, error: "invalid-month" },
    { months: [active, { ...active, month: january }], error: "multiple-active-months" },
    { months: [active], patch: { currentMonth: toYearMonth("2026-11") }, error: "future-month" },
    {
      months: [active, { ...active, month: january, status: "closed", closedOccurrences: [] }],
      error: "next-month-exists",
    },
    {
      months: [{ ...active, month: toYearMonth("9999-12") }],
      patch: { currentMonth: toYearMonth("9999-12") },
      error: "month-out-of-range",
    },
  ] as const)("rejects unsafe close: $error", ({ months, error, ...testCase }) => {
    const options = { ...input, ...("patch" in testCase ? testCase.patch : {}) };

    const result = closeMonth(months, options);

    expect(result).toEqual({ ok: false, error });
  });

  it.each([
    {
      items: [
        {
          ...item("bad", "expense", 100),
          schedule: { kind: "recurring", anchor: december, intervalMonths: 0 },
        },
      ],
      error: "invalid-occurrences",
    },
    {
      items: [item("duplicate", "expense", 100), item("duplicate", "expense", 100)],
      error: "invalid-occurrences",
    },
    { items: [item("bad", "expense", -1)], error: "invalid-amount" },
    {
      items: [item("a", "income", Number.MAX_SAFE_INTEGER), item("b", "income", 1)],
      error: "amount-overflow",
    },
    {
      paymentStatuses: [payment("a", "expense"), payment("a", "expense", false)],
      error: "duplicate-payment-status",
    },
    {
      paymentStatuses: [{ ...payment("a", "expense"), settled: "yes" as unknown as boolean }],
      error: "invalid-payment-status",
    },
    {
      overrides: [{ id: "bad", itemId: "a", itemType: "expense", month: december }],
      error: "invalid-occurrences",
    },
  ] satisfies readonly (Partial<CloseMonthInput> & { error: string })[])(
    "does not freeze invalid data: $error",
    ({ error, ...patch }) => {
      const options = { ...input, ...patch };

      const result = closeMonth([active], options);

      expect(result).toEqual({ ok: false, error });
    },
  );

  it.each(["update", "close"] as const)("rejects %s of closed history", (operation) => {
    const plan = closeMonth([active], input);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const closed = plan.value.closed;

    const result =
      operation === "update" ? updateBalance(closed, money(1)) : closeMonth([closed], input);

    expect(result).toEqual({
      ok: false,
      error: operation === "update" ? "month-closed" : "no-active-month",
    });
    expect(Object.isFrozen(closed)).toBe(true);
    expect(closed.closingBalance).toBe(120_000);
  });

  it("builds a detached snapshot that later item and payment edits cannot rewrite", () => {
    const source = { ...item("rent", "expense", 100) };
    const status = { ...payment("rent", "expense") };
    const { occurrences } = resolveOccurrences([source], [], december);

    const snapshot = buildClosedOccurrences(occurrences, [status]);
    source.amount = money(999);
    status.settled = false;

    expect(snapshot).toEqual({
      ok: true,
      value: [{ itemType: "expense", itemId: "rent", month: december, amount: 100, settled: true }],
    });
    if (!snapshot.ok) return;
    expect(Object.isFrozen(snapshot.value)).toBe(true);
    expect(Object.isFrozen(snapshot.value[0])).toBe(true);
  });
});

describe("month balances", () => {
  it("starts at the supplied month and balance, including a negative balance", () => {
    const openingBalance = money(-25_000);

    const result = createInitialMonth(december, openingBalance);

    expect(result).toEqual({
      ok: true,
      value: { ...active, openingBalance: -25_000, closingBalance: -25_000, netChange: 0 },
    });
  });

  it("updates actual balance without replacing opening balance or mutating input", () => {
    const balance = money(-50_000);

    const result = updateBalance(active, balance);

    expect(result).toEqual({
      ok: true,
      value: { ...active, closingBalance: -50_000, netChange: -150_000 },
    });
    expect(active.closingBalance).toBe(120_000);
  });

  it.each([
    { balance: 0.5, opening: 0, error: "invalid-amount" },
    { balance: Number.NaN, opening: 0, error: "invalid-amount" },
    { balance: Number.MAX_SAFE_INTEGER, opening: -1, error: "amount-overflow" },
  ])("rejects invalid or overflowing balances: $error", ({ balance, opening, error }) => {
    const month: BudgetMonth = { ...active, openingBalance: money(opening) };

    const result = updateBalance(month, balance as ActiveMonth["closingBalance"]);

    expect(result).toEqual({ ok: false, error });
  });
});
