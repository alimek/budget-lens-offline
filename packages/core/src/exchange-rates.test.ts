import { afterEach, describe, expect, it, vi } from "vitest";
import nbpResponses from "../test/fixtures/nbp-responses.json";
import type { AbortSignalLike, NbpFetch, RateStore, StoredRate } from "./index";
import {
  businessDaysBetween,
  convertMinorExact,
  createMemoryRateStore,
  DEFAULT_SETTINGS,
  fetchNbpRate,
  fetchNbpRates,
  getRate,
  isRateStale,
  NBP_TIMEOUT_MS,
  refreshNbpRates,
  requiredRateCurrencies,
  selectCurrentRates,
  toMinorUnits,
  warsawDate,
  warsawUtcOffsetHours,
} from "./index";

const NOW = Date.parse("2026-10-19T12:00:00Z");
const quote = (changes: Partial<StoredRate> = {}): StoredRate => ({
  currency: "USD",
  mid: "3.6512",
  source: "nbp",
  effectiveDate: "2026-10-19",
  fetchedAt: NOW,
  ...changes,
});

function fetchReturning(body: unknown, status = 200): NbpFetch {
  return vi.fn(async () => ({ ok: status === 200, status, json: async () => body }));
}

function tableResponse(rates: readonly { code: string; mid: unknown }[]) {
  return [{ table: "A", no: "202/A/NBP/2026", effectiveDate: "2026-10-16", rates }];
}

afterEach(() => {
  vi.useRealTimers();
});

describe("NBP quotes", () => {
  it("uses recorded JPY mid per one yen and values yen in grosze with existing money arithmetic", async () => {
    // Arrange
    const fetchFn = fetchReturning(nbpResponses.jpy);

    // Act
    const result = await fetchNbpRate("JPY", fetchFn);
    const grosze = result.ok
      ? convertMinorExact(toMinorUnits(10_000), result.value.mid, "1", "JPY", "PLN")
      : undefined;

    // Assert
    expect(result).toEqual({
      ok: true,
      value: { currency: "JPY", mid: "0.024574", source: "nbp", effectiveDate: "2026-10-16" },
    });
    expect(grosze).toBe(toMinorUnits(24_574));
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.nbp.pl/api/exchangerates/rates/A/JPY/?format=json",
      { signal: expect.objectContaining({ aborted: false }) },
    );
  });

  it.each([
    nbpResponses.emptyRates,
    nbpResponses.zeroMid,
    nbpResponses.stringMid,
    nbpResponses.missingEffectiveDate,
    { ...nbpResponses.usd, code: "EUR" },
    { ...nbpResponses.usd, table: "B" },
    { ...nbpResponses.usd, rates: [{ mid: 4, effectiveDate: "2026-02-30" }] },
    {
      ...nbpResponses.usd,
      rates: [{ mid: Number.POSITIVE_INFINITY, effectiveDate: "2026-10-19" }],
    },
    null,
  ])("rejects malformed or mismatched quotes: %j", async (body) => {
    // Arrange
    const fetchFn = fetchReturning(body);

    // Act
    const result = await fetchNbpRate("USD", fetchFn);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "invalid-response", currency: "USD" } });
  });

  it.each([
    [404, "not-found"],
    [503, "http-error"],
  ])("returns a code for HTTP %i", async (status, code) => {
    // Arrange
    const fetchFn = fetchReturning(null, status);

    // Act
    const result = await fetchNbpRate("USD", fetchFn);

    // Assert
    expect(result).toEqual({ ok: false, error: { code, currency: "USD", status } });
  });

  it("returns a network error when offline", async () => {
    // Arrange
    const fetchFn: NbpFetch = vi.fn(async () => {
      throw new TypeError("offline");
    });

    // Act
    const result = await fetchNbpRate("USD", fetchFn);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "network-error", currency: "USD" } });
  });

  it("aborts a request that never resolves after the default timeout and leaves no timer", async () => {
    // Arrange
    vi.useFakeTimers();
    const signals: AbortSignalLike[] = [];
    const fetchFn: NbpFetch = (_url, { signal }) => {
      signals.push(signal);
      return new Promise<never>(() => {});
    };

    // Act
    const pending = fetchNbpRates(["USD", "EUR"], fetchFn);
    await vi.advanceTimersByTimeAsync(NBP_TIMEOUT_MS - 1);
    const abortedEarly = signals.map((signal) => signal.aborted);
    await vi.advanceTimersByTimeAsync(1);
    const results = await pending;

    // Assert
    expect(abortedEarly).toEqual([false]);
    expect(signals.map((signal) => signal.aborted)).toEqual([true]);
    expect(vi.getTimerCount()).toBe(0);
    expect(results.get("USD")).toEqual({
      ok: false,
      error: { code: "network-error", currency: "USD" },
    });
    expect(results.get("EUR")).toEqual({
      ok: false,
      error: { code: "network-error", currency: "EUR" },
    });
  });

  it("aborts a response body that never arrives with the same signal", async () => {
    // Arrange
    vi.useFakeTimers();
    let requestSignal: AbortSignalLike | undefined;
    const fetchFn: NbpFetch = async (_url, { signal }) => {
      requestSignal = signal;
      return { ok: true, status: 200, json: () => new Promise<never>(() => {}) };
    };

    // Act
    const pending = fetchNbpRate("USD", fetchFn, { timeoutMs: 5 });
    await vi.advanceTimersByTimeAsync(5);
    const result = await pending;

    // Assert
    expect(requestSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(result).toEqual({ ok: false, error: { code: "network-error", currency: "USD" } });
  });

  it("maps a fetch rejected with an AbortError to a network error", async () => {
    // Arrange
    const fetchFn: NbpFetch = async () => {
      throw Object.assign(new Error("The operation was aborted."), { name: "AbortError" });
    };

    // Act
    const result = await fetchNbpRate("USD", fetchFn);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "network-error", currency: "USD" } });
  });

  it("clears the timer after a successful request", async () => {
    // Arrange
    vi.useFakeTimers();
    const fetchFn = fetchReturning(nbpResponses.usd);

    // Act
    const result = await fetchNbpRate("USD", fetchFn);

    // Assert
    expect(result.ok).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects unreadable JSON without leaking a transport exception", async () => {
    // Arrange
    const fetchFn: NbpFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("invalid JSON");
      },
    });

    // Act
    const result = await fetchNbpRate("USD", fetchFn);

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "invalid-response", currency: "USD" } });
  });

  it("fetches one table, preserving valid currencies when another quote is bad or missing", async () => {
    // Arrange
    const fetchFn = fetchReturning(
      tableResponse([
        { code: "JPY", mid: 0.024574 },
        { code: "HUF", mid: 0.01202 },
        { code: "EUR", mid: 0 },
      ]),
    );

    // Act
    const results = await fetchNbpRates(["JPY", "HUF", "EUR", "USD", "JPY", "PLN"], fetchFn);

    // Assert
    expect(results.get("JPY")).toMatchObject({ ok: true, value: { mid: "0.024574" } });
    expect(results.get("HUF")).toMatchObject({ ok: true, value: { mid: "0.01202" } });
    expect(results.get("EUR")).toMatchObject({ ok: false, error: { code: "invalid-response" } });
    expect(results.get("USD")).toMatchObject({ ok: false, error: { code: "not-found" } });
    expect(results.has("PLN")).toBe(false);
    expect(fetchFn).toHaveBeenCalledExactlyOnceWith(
      "https://api.nbp.pl/api/exchangerates/tables/A/?format=json",
      { signal: expect.objectContaining({ aborted: false }) },
    );
  });

  it("keeps tiny numeric quotes in decimal notation without rounding", async () => {
    // Arrange
    const fetchFn = fetchReturning(tableResponse([{ code: "JPY", mid: 1.234e-7 }]));

    // Act
    const results = await fetchNbpRates(["JPY"], fetchFn);

    // Assert
    expect(results.get("JPY")).toMatchObject({ ok: true, value: { mid: "0.0000001234" } });
  });

  it.each([null, [], [{ table: "B", effectiveDate: "2026-10-16", rates: [] }]])(
    "rejects malformed full tables: %j",
    async (body) => {
      // Arrange
      const fetchFn = fetchReturning(body);

      // Act
      const results = await fetchNbpRates(["USD"], fetchFn);

      // Assert
      expect(results.get("USD")).toMatchObject({ ok: false, error: { code: "invalid-response" } });
    },
  );
});

describe("current rate lookup", () => {
  it("supplies selected decimal legs to existing exact conversion without rounding through PLN", () => {
    // Arrange
    const rates = selectCurrentRates([
      quote({ currency: "JPY", mid: "0.024574" }),
      quote({ currency: "EUR", mid: "4.3661" }),
    ]);

    // Act
    const euroCents = convertMinorExact(
      toMinorUnits(10_000),
      rates.get("JPY")?.mid ?? "0",
      rates.get("EUR")?.mid ?? "0",
      "JPY",
      "EUR",
    );

    // Assert
    expect(euroCents).toBe(toMinorUnits(5_628));
  });

  it.each([
    ["2026-10-18", "2026-10-19", "manual"],
    ["2026-10-19", "2026-10-18", "nbp"],
    ["2026-10-19", "2026-10-19", "manual"],
  ] as const)(
    "selects by effective date, with manual winning a tie: %s / %s",
    (nbpDate, manualDate, source) => {
      // Arrange
      const nbp = quote({ effectiveDate: nbpDate });
      const manual = quote({ source: "manual", effectiveDate: manualDate, mid: "4" });

      // Act
      const forward = selectCurrentRates([nbp, manual]).get("USD");
      const reverse = selectCurrentRates([manual, nbp]).get("USD");

      // Assert
      expect(forward?.source).toBe(source);
      expect(reverse).toEqual(forward);
    },
  );

  it.each(["nbp", "manual"] as const)(
    "measures %s freshness in business days against the Settings threshold",
    async (source) => {
      // Arrange: Wednesday 2026-10-14 checked on Monday 2026-10-19 is 3 business days old.
      const store = createMemoryRateStore();
      await store.set(quote({ source, effectiveDate: "2026-10-14", fetchedAt: NOW }));
      const settings = { ...DEFAULT_SETTINGS, rateMaxAgeBusinessDays: 3 };

      // Act
      const lenient = await getRate("USD", {
        store,
        today: "2026-10-19",
        maxAgeBusinessDays: settings.rateMaxAgeBusinessDays,
      });
      const byDefault = await getRate("USD", {
        store,
        today: "2026-10-19",
        maxAgeBusinessDays: DEFAULT_SETTINGS.rateMaxAgeBusinessDays,
      });

      // Assert
      expect(lenient).toMatchObject({
        ok: true,
        value: { mid: "3.6512", source, effectiveDate: "2026-10-14", stale: false },
      });
      expect(byDefault).toMatchObject({ ok: true, value: { source, stale: true } });
    },
  );

  it.each(["nbp", "manual"] as const)(
    "keeps a Friday %s quote fresh on Monday, without refreshing",
    async (source) => {
      // Arrange
      const store = createMemoryRateStore();
      await store.set(quote({ source, effectiveDate: "2026-10-16", fetchedAt: NOW }));

      // Act
      const result = await getRate("USD", {
        store,
        today: "2026-10-19",
        maxAgeBusinessDays: DEFAULT_SETTINGS.rateMaxAgeBusinessDays,
      });

      // Assert
      expect(result).toMatchObject({
        ok: true,
        value: { mid: "3.6512", source, effectiveDate: "2026-10-16", stale: false },
      });
    },
  );

  it("returns a missing-rate code when offline on first use", async () => {
    // Arrange
    const store = createMemoryRateStore();

    // Act
    const result = await getRate("USD", { store, today: "2026-10-19", maxAgeBusinessDays: 2 });

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "missing-rate", currency: "USD" } });
  });

  it("rejects malformed stored quotes instead of selecting them", async () => {
    // Arrange
    const store: RateStore = {
      ...createMemoryRateStore(),
      get: async () => [quote({ effectiveDate: "2026-02-30" })],
    };

    // Act
    const result = await getRate("USD", { store, today: "2026-10-19", maxAgeBusinessDays: 2 });

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "invalid-rate", currency: "USD" } });
  });

  it("skips a malformed row of one source and keeps the valid row of the other", async () => {
    // Arrange
    const store: RateStore = {
      ...createMemoryRateStore(),
      get: async () => [
        quote({ source: "manual", mid: "4", effectiveDate: "2026-02-30" }),
        quote({ effectiveDate: "2026-10-16" }),
      ],
    };

    // Act
    const result = await getRate("USD", { store, today: "2026-10-19", maxAgeBusinessDays: 2 });

    // Assert
    expect(result).toMatchObject({
      ok: true,
      value: { mid: "3.6512", source: "nbp", effectiveDate: "2026-10-16", stale: false },
    });
  });

  // 2026-10-12 is a Monday. Default threshold: 2 business days strictly between effective date and today.
  it.each([
    ["Friday rate on Monday", "2026-10-16", "2026-10-19", false],
    ["Thursday rate on Monday", "2026-10-15", "2026-10-19", false],
    ["3 business days old (Wednesday on Monday)", "2026-10-14", "2026-10-19", true],
    [
      "exactly 2 business days old (Monday on Wednesday), boundary",
      "2026-10-12",
      "2026-10-14",
      false,
    ],
    ["Monday rate on Thursday", "2026-10-12", "2026-10-15", true],
    ["same day", "2026-10-19", "2026-10-19", false],
    ["Friday rate on Saturday", "2026-10-16", "2026-10-17", false],
    ["Friday rate on Sunday", "2026-10-16", "2026-10-18", false],
    ["Thursday rate on Sunday", "2026-10-15", "2026-10-18", false],
    ["Wednesday rate on Saturday", "2026-10-14", "2026-10-17", true],
    ["Wednesday rate on Sunday", "2026-10-14", "2026-10-18", true],
    ["Saturday-dated manual rate on Tuesday", "2026-10-17", "2026-10-20", false],
    ["Friday rate on Tuesday", "2026-10-16", "2026-10-20", false],
    ["Friday rate on Wednesday", "2026-10-16", "2026-10-21", true],
    ["effective date after today", "2026-10-20", "2026-10-19", false],
    ["across a leap day (Wed 2024-02-28 on Mon 2024-03-04)", "2024-02-28", "2024-03-04", true],
  ] as const)("default threshold: %s", (_case, date, today, expected) => {
    // Arrange
    const threshold = DEFAULT_SETTINGS.rateMaxAgeBusinessDays;

    // Act
    const stale = isRateStale(date, today, threshold);

    // Assert
    expect(stale).toBe(expected);
  });

  it.each([
    ["2026-10-16", "2026-10-19", 0],
    ["2026-10-15", "2026-10-19", 1],
    ["2026-10-14", "2026-10-19", 2],
    ["2026-10-17", "2026-10-18", 0],
    ["2026-10-12", "2026-10-26", 9],
    ["2026-01-01", "2027-01-01", 260],
    ["2026-10-19", "2026-10-12", 0],
  ] as const)("counts business days strictly between %s and %s", (from, to, expected) => {
    // Act
    const count = businessDaysBetween(from, to);

    // Assert
    expect(count).toBe(expected);
  });

  it.each([
    ["2026-02-30", "2026-10-19", 2],
    ["2026-10-16", "19.10.2026", 2],
    ["2026-10-16", "2026-10-19", 0],
    ["2026-10-16", "2026-10-19", 1.5],
  ] as const)("rejects invalid freshness input: %s / %s / %s", (date, today, threshold) => {
    // Act
    const check = () => isRateStale(date, today, threshold);

    // Assert
    expect(check).toThrow(RangeError);
  });
});

describe("Warsaw date", () => {
  it.each([
    ["the last second of a CEST day", "2026-10-18T21:59:59Z", "2026-10-18"],
    ["Warsaw midnight (CEST), still the previous day in UTC", "2026-10-18T22:00:00Z", "2026-10-19"],
    ["UTC midnight, 02:00 in Warsaw", "2026-10-19T00:00:00Z", "2026-10-19"],
    ["the last second of a CET day", "2026-01-15T22:59:59Z", "2026-01-15"],
    ["Warsaw midnight (CET)", "2026-01-15T23:00:00Z", "2026-01-16"],
    ["the evening before DST starts", "2026-03-28T22:59:59Z", "2026-03-28"],
    ["midnight on the DST start day (CET)", "2026-03-28T23:00:00Z", "2026-03-29"],
    ["the last second of the DST start day (CEST)", "2026-03-29T21:59:59Z", "2026-03-29"],
    ["midnight after DST starts (CEST)", "2026-03-29T22:00:00Z", "2026-03-30"],
    ["02:59:59 CEST, just before DST ends", "2026-10-25T00:59:59Z", "2026-10-25"],
    ["the last second of the DST end day (CET)", "2026-10-25T22:59:59Z", "2026-10-25"],
    ["midnight after DST ends (CET)", "2026-10-25T23:00:00Z", "2026-10-26"],
    ["UTC midnight in winter, 01:00 in Warsaw", "2026-01-16T00:00:00Z", "2026-01-16"],
    ["the last second of a CET year", "2026-12-31T22:59:59Z", "2026-12-31"],
    ["Warsaw new year, still the old year in UTC", "2026-12-31T23:00:00Z", "2027-01-01"],
  ])("returns Warsaw's calendar date at %s", (_case, instant, expected) => {
    // Act
    const date = warsawDate(new Date(instant));

    // Assert
    expect(date).toBe(expected);
  });

  it.each([
    ["1 ms before DST starts 2026", "2026-03-29T00:59:59.999Z", 1],
    ["the DST start instant 2026", "2026-03-29T01:00:00.000Z", 2],
    ["1 ms after DST starts 2026", "2026-03-29T01:00:00.001Z", 2],
    ["1 ms before DST ends 2026", "2026-10-25T00:59:59.999Z", 2],
    ["the DST end instant 2026", "2026-10-25T01:00:00.000Z", 1],
    ["1 ms after DST ends 2026", "2026-10-25T01:00:00.001Z", 1],
    ["1 ms before DST starts 2027", "2027-03-28T00:59:59.999Z", 1],
    ["the DST start instant 2027", "2027-03-28T01:00:00.000Z", 2],
    ["1 ms after DST starts 2027", "2027-03-28T01:00:00.001Z", 2],
    ["1 ms before DST ends 2027", "2027-10-31T00:59:59.999Z", 2],
    ["the DST end instant 2027", "2027-10-31T01:00:00.000Z", 1],
    ["1 ms after DST ends 2027", "2027-10-31T01:00:00.001Z", 1],
  ])("uses the EU summer-time rule at %s", (_case, instant, expected) => {
    // Arrange
    const at = new Date(instant);

    // Act
    const offset = warsawUtcOffsetHours(at);

    // Assert
    expect(offset).toBe(expected);
  });

  it.each([
    ["Warsaw midnight on the 2027 DST start day (CET)", "2027-03-27T23:00:00Z", "2027-03-28"],
    ["Warsaw midnight after the 2027 DST start (CEST)", "2027-03-28T22:00:00Z", "2027-03-29"],
    [
      "1 ms before Warsaw midnight after the 2027 DST start",
      "2027-03-28T21:59:59.999Z",
      "2027-03-28",
    ],
    ["Warsaw midnight on the 2027 DST end day (CEST)", "2027-10-30T22:00:00Z", "2027-10-31"],
    ["Warsaw midnight after the 2027 DST end (CET)", "2027-10-31T23:00:00Z", "2027-11-01"],
    [
      "1 ms before Warsaw midnight after the 2027 DST end",
      "2027-10-31T22:59:59.999Z",
      "2027-10-31",
    ],
  ])("returns Warsaw's calendar date at %s", (_case, instant, expected) => {
    // Act
    const date = warsawDate(new Date(instant));

    // Assert
    expect(date).toBe(expected);
  });

  it("rejects an invalid instant", () => {
    // Arrange
    const invalid = new Date(Number.NaN);

    // Act
    const date = () => warsawDate(invalid);
    const offset = () => warsawUtcOffsetHours(invalid);

    // Assert
    expect(date).toThrow(RangeError);
    expect(offset).toThrow(RangeError);
  });
});

describe("app-open rate refresh", () => {
  it("gets currencies from Settings, items and savings, including the non-PLN base", () => {
    // Arrange
    const settings = {
      ...DEFAULT_SETTINGS,
      baseCurrency: "EUR" as const,
      trackedCurrencies: ["USD", "PLN"] as const,
    };

    // Act
    const currencies = requiredRateCurrencies(settings, ["JPY", "USD"], ["HUF", "JPY"]);

    // Assert
    expect(currencies).toEqual(["EUR", "USD", "JPY", "HUF"]);
  });

  it("refreshes an older table, then retries no sooner than an hour, without replacing manual", async () => {
    // Arrange: Thursday's table cached on Monday; NBP still serves Friday's table.
    const store = createMemoryRateStore();
    await store.set(quote({ effectiveDate: "2026-10-15", fetchedAt: NOW - 86_400_000 }));
    await store.set(quote({ source: "manual", mid: "4" }));
    const fetchFn = fetchReturning(tableResponse([{ code: "USD", mid: 3.9 }]));

    // Act
    const results = await refreshNbpRates(["USD"], { store, fetchFn, now: NOW });
    await refreshNbpRates(["USD"], { store, fetchFn, now: NOW + 3_599_999 });
    await refreshNbpRates(["USD"], { store, fetchFn, now: NOW + 3_600_000 });

    // Assert
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(results.get("USD")).toMatchObject({ ok: true, value: { mid: "3.9", fetchedAt: NOW } });
    expect(await store.get("USD")).toContainEqual(quote({ source: "manual", mid: "4" }));
  });

  it.each([
    ["Saturday", "2026-10-17T12:00:00+02:00"],
    ["Sunday", "2026-10-18T12:00:00+02:00"],
    ["Sunday 23:30 in Warsaw (already Monday east of Warsaw)", "2026-10-18T23:30:00+02:00"],
  ])(
    "does not refetch Friday's table on %s, however long ago it was fetched",
    async (_day, instant) => {
      // Arrange
      const now = Date.parse(instant);
      const store = createMemoryRateStore();
      await store.set(quote({ effectiveDate: "2026-10-16", fetchedAt: now - 7 * 86_400_000 }));
      const fetchFn = fetchReturning(tableResponse([{ code: "USD", mid: 3.9 }]));

      // Act
      const results = await refreshNbpRates(["USD"], { store, fetchFn, now });

      // Assert
      expect(fetchFn).not.toHaveBeenCalled();
      expect(results.get("USD")).toMatchObject({
        ok: true,
        value: { effectiveDate: "2026-10-16" },
      });
    },
  );

  it("fetches a table published after an early fetch on the same day", async () => {
    // Arrange: Friday's table fetched at 07:00 on Monday; Monday's table is published at midday.
    const mondayMorning = Date.parse("2026-10-19T07:00:00+02:00");
    const store = createMemoryRateStore();
    await store.set(quote({ effectiveDate: "2026-10-16", fetchedAt: mondayMorning }));
    const fetchFn: NbpFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => [
        { table: "A", effectiveDate: "2026-10-19", rates: [{ code: "USD", mid: 3.9 }] },
      ],
    });

    // Act
    const results = await refreshNbpRates(["USD"], {
      store,
      fetchFn,
      now: mondayMorning + 6 * 3_600_000,
    });

    // Assert
    expect(results.get("USD")).toMatchObject({
      ok: true,
      value: { mid: "3.9", effectiveDate: "2026-10-19" },
    });
  });

  it("keeps Friday's rate fresh on Monday morning before Monday's table is published", async () => {
    // Arrange: Monday 2026-10-19 07:00 Warsaw; NBP still serves Friday's (2026-10-16) table.
    const mondayMorning = Date.parse("2026-10-19T07:00:00+02:00");
    const store = createMemoryRateStore();
    await store.set(
      quote({ effectiveDate: "2026-10-15", fetchedAt: mondayMorning - 3 * 86_400_000 }),
    );
    const fetchFn = fetchReturning(tableResponse([{ code: "USD", mid: 3.9 }]));

    // Act
    const refresh = await refreshNbpRates(["USD"], {
      store,
      fetchFn,
      now: mondayMorning,
    });
    const lookup = await getRate("USD", {
      store,
      today: "2026-10-19",
      maxAgeBusinessDays: DEFAULT_SETTINGS.rateMaxAgeBusinessDays,
    });

    // Assert
    expect(refresh.get("USD")).toMatchObject({ ok: true, value: { effectiveDate: "2026-10-16" } });
    expect(lookup).toMatchObject({
      ok: true,
      value: { mid: "3.9", effectiveDate: "2026-10-16", stale: false },
    });
  });

  it("refetches Friday's table from Monday 00:30 in Warsaw, while it is still Sunday in UTC", async () => {
    // Arrange: 2026-10-18T22:30Z is Monday 00:30 in Warsaw.
    const now = Date.parse("2026-10-18T22:30:00Z");
    const store = createMemoryRateStore();
    await store.set(quote({ effectiveDate: "2026-10-16", fetchedAt: now - 2 * 86_400_000 }));
    const fetchFn = fetchReturning(tableResponse([{ code: "USD", mid: 3.9 }]));

    // Act
    await refreshNbpRates(["USD"], { store, fetchFn, now });

    // Assert
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("never replaces a newer cached table with an older NBP response, but records the fetch", async () => {
    // Arrange: Monday's table is cached; on Tuesday a stale proxy still serves Friday's table.
    const now = Date.parse("2026-10-20T12:00:00+02:00");
    const cached = quote({ mid: "3.7", effectiveDate: "2026-10-19", fetchedAt: now - 86_400_000 });
    const store = createMemoryRateStore();
    await store.set(cached);
    const fetchFn = fetchReturning(tableResponse([{ code: "USD", mid: 3.9 }]));

    // Act
    const results = await refreshNbpRates(["USD"], { store, fetchFn, now });

    // Assert
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(results.get("USD")).toEqual({ ok: true, value: { ...cached, fetchedAt: now } });
    expect(await store.get("USD")).toEqual([{ ...cached, fetchedAt: now }]);
  });

  it("keeps the last rate after a failed refresh and returns it stale offline", async () => {
    // Arrange
    const store = createMemoryRateStore();
    const old = quote({ effectiveDate: "2026-10-14", fetchedAt: NOW - 86_400_000 });
    await store.set(old);
    const fetchFn: NbpFetch = async () => {
      throw new TypeError("offline");
    };

    // Act
    const refresh = await refreshNbpRates(["USD"], {
      store,
      fetchFn,
      now: NOW,
    });
    const lookup = await getRate("USD", { store, today: "2026-10-19", maxAgeBusinessDays: 2 });

    // Assert
    expect(refresh.get("USD")).toMatchObject({ ok: false, error: { code: "network-error" } });
    expect(await store.get("USD")).toEqual([old]);
    expect(lookup).toMatchObject({ ok: true, value: { mid: old.mid, stale: true } });
  });

  it("persists good currencies even when another currency cannot be saved", async () => {
    // Arrange
    const memory = createMemoryRateStore();
    const store: RateStore = {
      ...memory,
      set: async (rate) => {
        if (rate.currency === "USD") throw new Error("write failed");
        await memory.set(rate);
      },
    };
    const fetchFn = fetchReturning(
      tableResponse([
        { code: "USD", mid: 3.9 },
        { code: "JPY", mid: 0.024574 },
      ]),
    );

    // Act
    const results = await refreshNbpRates(["USD", "JPY"], {
      store,
      fetchFn,
      now: NOW,
    });

    // Assert
    expect(results.get("USD")).toMatchObject({ ok: false, error: { code: "storage-error" } });
    expect(results.get("JPY")).toMatchObject({ ok: true, value: { mid: "0.024574" } });
    expect(await memory.getAll()).toHaveLength(1);
  });
});
