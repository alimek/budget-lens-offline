import { describe, expect, it } from "vitest";
import type { CurrencyCode } from "./currency";
import { toMinorUnits } from "./money";
import {
  type ActiveMonth,
  type BudgetMonth,
  buildClosedOccurrences,
  type CloseMonthInput,
  type ClosingItem,
  closeMonth,
  createInitialMonth,
  type PaymentStatus,
  updateBalance,
} from "./month-closing";
import { type OccurrenceOverride, resolveOccurrences } from "./occurrence-overrides";
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
  baseCurrency: "PLN",
  rates: {},
  currentMonth: december,
  closingBalance: money(120_000),
  items: [],
  overrides: [],
  paymentStatuses: [],
};
const item = (id: string, itemType: "expense" | "income", amount: number): ClosingItem => ({
  currency: "PLN",
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
    // Arrange
    const items: readonly ClosingItem[] = [
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

    // Act
    const result = closeMonth([active], {
      ...input,
      items,
      overrides,
      paymentStatuses: [payment("rent", "expense"), payment("skip", "expense")],
    });

    // Assert
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
    // Arrange
    const items: readonly ClosingItem[] = [
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

    // Act
    const result = closeMonth([active], { ...input, items, paymentStatuses });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.unpaid.map((row) => row.itemId)).toEqual(["pending"]);
    expect(result.value.unreceived.map((row) => row.itemId)).toEqual(["same", "future"]);
    expect(result.value.closed.closedOccurrences).toHaveLength(4);
  });

  it("freezes original currency, applied rate and converted totals after overrides", () => {
    // Arrange
    const items: ClosingItem[] = [
      { ...item("rent", "expense", 10_000), currency: "EUR" },
      { ...item("salary", "income", 10_000), currency: "JPY" },
      item("local", "expense", 500),
    ];
    const rates = { EUR: 4.25, JPY: 0.024574, PLN: 999 };
    const overrides: OccurrenceOverride[] = [
      {
        id: "rent-adjustment",
        itemId: "rent",
        itemType: "expense",
        month: december,
        amount: money(15_000),
      },
    ];

    // Act
    const result = closeMonth([active], { ...input, items, rates, overrides });
    rates.EUR = 5;
    items[0] = { ...item("rent", "expense", 1), currency: "USD" };

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.closed).toMatchObject({
      baseCurrency: "PLN",
      totalExpenses: 64_250,
      totalIncome: 24_574,
    });
    expect(result.value.closed.closedOccurrences).toEqual([
      {
        ...payment("rent", "expense", false),
        amount: 15_000,
        currency: "EUR",
        rate: 4.25,
        baseAmount: 63_750,
      },
      {
        ...payment("salary", "income", false),
        amount: 10_000,
        currency: "JPY",
        rate: 0.024574,
        baseAmount: 24_574,
      },
      {
        ...payment("local", "expense", false),
        amount: 500,
        currency: "PLN",
        rate: 1,
        baseAmount: 500,
      },
    ]);
    expect(result.value.unpaid[0]?.baseAmount).toBe(63_750);
  });

  it.each([
    { source: "PLN", target: "JPY", amount: 99, rate: 0.5, expected: 0 },
    { source: "PLN", target: "JPY", amount: 100, rate: 0.5, expected: 1 },
    { source: "JPY", target: "PLN", amount: 1, rate: 0.005, expected: 1 },
    { source: "EUR", target: "USD", amount: 101, rate: 1.5, expected: 152 },
  ] satisfies {
    source: CurrencyCode;
    target: CurrencyCode;
    amount: number;
    rate: number;
    expected: number;
  }[])(
    "converts $source to $target with one final rounding ($amount at $rate)",
    ({ source, target, amount, rate, expected }) => {
      // Arrange
      const items = [{ ...item("foreign", "income", amount), currency: source }];

      // Act
      const result = closeMonth([active], {
        ...input,
        items,
        baseCurrency: target,
        rates: { [source]: rate },
      });

      // Assert
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.closed.totalIncome).toBe(money(expected));
    },
  );

  it.each([
    { rates: {}, error: "missing-exchange-rate" },
    {
      rates: Object.create({ EUR: 4 }) as CloseMonthInput["rates"],
      error: "missing-exchange-rate",
    },
    { rates: { EUR: 0 }, error: "invalid-exchange-rate" },
    { rates: { EUR: -1 }, error: "invalid-exchange-rate" },
    { rates: { EUR: Number.NaN }, error: "invalid-exchange-rate" },
    { rates: { EUR: Number.POSITIVE_INFINITY }, error: "invalid-exchange-rate" },
    { rates: { EUR: Number.MAX_VALUE }, error: "amount-overflow" },
  ])("rejects unavailable or unsafe foreign conversion: $error", ({ rates, error }) => {
    // Arrange
    const items: ClosingItem[] = [{ ...item("foreign", "expense", 100), currency: "EUR" }];

    // Act
    const result = closeMonth([active], { ...input, items, rates });

    // Assert
    expect(result).toEqual({ ok: false, error });
  });

  it("requires rates only for effective foreign occurrences", () => {
    // Arrange
    const items: ClosingItem[] = [
      { ...item("skipped", "expense", 100), currency: "EUR" },
      {
        ...item("later", "income", 100),
        currency: "USD",
        schedule: { kind: "one-time", month: january },
      },
    ];
    const overrides: OccurrenceOverride[] = [
      {
        id: "skip",
        itemId: "skipped",
        itemType: "expense",
        month: december,
        skipped: true,
      },
    ];

    // Act
    const result = closeMonth([active], { ...input, items, overrides, rates: {} });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.closed.closedOccurrences).toEqual([]);
  });

  it.each([
    { months: [], error: "no-active-month" },
    { months: [null as unknown as BudgetMonth, active], error: "invalid-month" },
    {
      months: [
        {
          ...active,
          month: toYearMonth("2026-10"),
          status: "closed",
          baseCurrency: "PLN",
          closedOccurrences: [],
        },
        { ...active, month: toYearMonth("2026-10") },
      ],
      error: "month-sequence-conflict",
    },
    {
      months: [
        {
          ...active,
          month: toYearMonth("2026-11"),
          status: "closed",
          baseCurrency: "PLN",
          closedOccurrences: [],
        },
        { ...active, month: toYearMonth("2026-09") },
      ],
      error: "month-sequence-conflict",
    },
    { months: [active], patch: { currentMonth: "2026-13" as YearMonth }, error: "invalid-month" },
    { months: [active, { ...active, month: january }], error: "multiple-active-months" },
    { months: [active], patch: { currentMonth: toYearMonth("2026-11") }, error: "future-month" },
    {
      months: [
        active,
        { ...active, month: january, status: "closed", baseCurrency: "PLN", closedOccurrences: [] },
      ],
      error: "month-sequence-conflict",
    },
    {
      months: [{ ...active, month: toYearMonth("9999-12") }],
      patch: { currentMonth: toYearMonth("9999-12") },
      error: "month-out-of-range",
    },
  ] as const)("rejects unsafe close: $error", ({ months, error, ...testCase }) => {
    // Arrange
    const options = { ...input, ...("patch" in testCase ? testCase.patch : {}) };

    // Act
    const result = closeMonth(months, options);

    // Assert
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
      // Arrange
      const options = { ...input, ...patch };

      // Act
      const result = closeMonth([active], options);

      // Assert
      expect(result).toEqual({ ok: false, error });
    },
  );

  it.each(["update", "close"] as const)("rejects %s of closed history", (operation) => {
    // Arrange
    const plan = closeMonth([active], input);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const closed = plan.value.closed;

    // Act
    const result =
      operation === "update" ? updateBalance(closed, money(1)) : closeMonth([closed], input);

    // Assert
    expect(result).toEqual({
      ok: false,
      error: operation === "update" ? "month-closed" : "no-active-month",
    });
    expect(Object.isFrozen(closed)).toBe(true);
    expect(closed.closingBalance).toBe(120_000);
  });

  it("builds a detached snapshot that later item and payment edits cannot rewrite", () => {
    // Arrange
    const source = { ...item("rent", "expense", 100) };
    const status = { ...payment("rent", "expense") };
    const { occurrences } = resolveOccurrences([source], [], december);

    // Act
    const snapshot = buildClosedOccurrences(occurrences, [status], input);
    source.amount = money(999);
    status.settled = false;

    // Assert
    expect(snapshot).toEqual({
      ok: true,
      value: [
        {
          itemType: "expense",
          itemId: "rent",
          month: december,
          amount: 100,
          currency: "PLN",
          rate: 1,
          baseAmount: 100,
          settled: true,
        },
      ],
    });
    if (!snapshot.ok) return;
    expect(Object.isFrozen(snapshot.value)).toBe(true);
    expect(Object.isFrozen(snapshot.value[0])).toBe(true);
  });
});

describe("month balances", () => {
  it("starts at the supplied month and balance, including a negative balance", () => {
    // Arrange
    const openingBalance = money(-25_000);

    // Act
    const result = createInitialMonth(december, openingBalance);

    // Assert
    expect(result).toEqual({
      ok: true,
      value: { ...active, openingBalance: -25_000, closingBalance: -25_000, netChange: 0 },
    });
  });

  it("updates actual balance without replacing opening balance or mutating input", () => {
    // Arrange
    const balance = money(-50_000);

    // Act
    const result = updateBalance(active, balance);

    // Assert
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
    // Arrange
    const month: BudgetMonth = { ...active, openingBalance: money(opening) };

    // Act
    const result = updateBalance(month, balance as ActiveMonth["closingBalance"]);

    // Assert
    expect(result).toEqual({ ok: false, error });
  });
});
