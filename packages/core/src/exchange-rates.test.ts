import { describe, expect, it, vi } from "vitest";
import nbpResponses from "../test/fixtures/nbp-responses.json";
import type { NbpFetch, RateStore, StoredRate } from "./index";
import {
  convertMinor,
  convertMinorExact,
  createMemoryRateStore,
  DEFAULT_SETTINGS,
  fetchNbpRate,
  fetchNbpRates,
  getRate,
  isRateStale,
  refreshNbpRates,
  requiredRateCurrencies,
  selectCurrentRates,
  toMinorUnits,
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

describe("NBP quotes", () => {
  it("uses recorded JPY mid per one yen and values yen in grosze with existing money arithmetic", async () => {
    // Arrange
    const fetchFn = fetchReturning(nbpResponses.jpy);

    // Act
    const result = await fetchNbpRate("JPY", fetchFn);
    const grosze = result.ok
      ? convertMinor(toMinorUnits(10_000), Number(result.value.mid), "JPY", "PLN")
      : undefined;

    // Assert
    expect(result).toEqual({
      ok: true,
      value: { currency: "JPY", mid: "0.024574", source: "nbp", effectiveDate: "2026-10-16" },
    });
    expect(grosze).toBe(toMinorUnits(24_574));
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.nbp.pl/api/exchangerates/rates/A/JPY/?format=json",
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
    "measures %s freshness by effective date and Settings threshold",
    async (source) => {
      // Arrange
      const store = createMemoryRateStore();
      await store.set(quote({ source, effectiveDate: "2026-10-18", fetchedAt: NOW }));
      const settings = { ...DEFAULT_SETTINGS, rateMaxAgeHours: 48 };

      // Act
      const result = await getRate("USD", {
        store,
        now: "2026-10-19",
        maxAgeHours: settings.rateMaxAgeHours,
      });

      // Assert
      expect(result).toMatchObject({
        ok: true,
        value: { mid: "3.6512", source, effectiveDate: "2026-10-18", stale: false },
      });
    },
  );

  it("returns an old weekend quote as stale even when fetched today, without refreshing", async () => {
    // Arrange
    const store = createMemoryRateStore();
    await store.set(quote({ effectiveDate: "2026-10-16", fetchedAt: NOW }));

    // Act
    const result = await getRate("USD", {
      store,
      now: "2026-10-19",
      maxAgeHours: DEFAULT_SETTINGS.rateMaxAgeHours,
    });

    // Assert
    expect(result).toMatchObject({
      ok: true,
      value: { mid: "3.6512", source: "nbp", effectiveDate: "2026-10-16", stale: true },
    });
  });

  it("returns a missing-rate code when offline on first use", async () => {
    // Arrange
    const store = createMemoryRateStore();

    // Act
    const result = await getRate("USD", { store, now: "2026-10-19", maxAgeHours: 24 });

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "missing-rate", currency: "USD" } });
  });

  it("uses implicit PLN without reading storage", async () => {
    // Arrange
    const store: RateStore = {
      ...createMemoryRateStore(),
      get: vi.fn(async () => {
        throw new Error("unavailable");
      }),
    };

    // Act
    const result = await getRate("PLN", { store, now: "2026-10-19", maxAgeHours: 24 });

    // Assert
    expect(result).toMatchObject({
      ok: true,
      value: { mid: "1", source: "implicit", stale: false },
    });
    expect(store.get).not.toHaveBeenCalled();
  });

  it("replaces only the current source row and isolates cached values from callers", async () => {
    // Arrange
    const store = createMemoryRateStore();
    await store.set(quote({ effectiveDate: "2026-10-16" }));
    await store.set(quote({ source: "manual", mid: "4" }));
    const next = { ...quote(), mid: "3.9" };

    // Act
    await store.set(next);
    next.mid = "999";
    const rows = await store.getAll();

    // Assert
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual(quote({ mid: "3.9" }));
    expect(rows).toContainEqual(quote({ source: "manual", mid: "4" }));
  });

  it("rejects malformed stored quotes instead of selecting them", async () => {
    // Arrange
    const store: RateStore = {
      ...createMemoryRateStore(),
      get: async () => [quote({ effectiveDate: "2026-02-30" })],
    };

    // Act
    const result = await getRate("USD", { store, now: "2026-10-19", maxAgeHours: 24 });

    // Assert
    expect(result).toEqual({ ok: false, error: { code: "invalid-rate", currency: "USD" } });
  });

  it.each([
    ["2026-10-19", "2026-10-19", 24, false],
    ["2026-10-18", "2026-10-19", 24, true],
    ["2024-02-28", "2024-03-01", 48, true],
  ] as const)(
    "marks stale at the threshold, including leap days: %s / %s",
    (date, today, hours, expected) => {
      // Arrange
      const threshold = hours;

      // Act
      const stale = isRateStale(date, today, threshold);

      // Assert
      expect(stale).toBe(expected);
    },
  );
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

  it("skips recent successful fetches, then refreshes at 24 hours without replacing manual", async () => {
    // Arrange
    const store = createMemoryRateStore();
    await store.set(quote({ fetchedAt: NOW - 86_400_000 }));
    await store.set(quote({ source: "manual", mid: "4" }));
    const fetchFn = fetchReturning(tableResponse([{ code: "USD", mid: 3.9 }]));

    // Act
    const results = await refreshNbpRates(["USD"], { store, fetchFn, now: NOW });
    await refreshNbpRates(["USD"], { store, fetchFn, now: NOW + 1 });

    // Assert
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(results.get("USD")).toMatchObject({ ok: true, value: { mid: "3.9", fetchedAt: NOW } });
    expect(await store.get("USD")).toContainEqual(quote({ source: "manual", mid: "4" }));
  });

  it("keeps the last rate after a failed refresh and returns it stale offline", async () => {
    // Arrange
    const store = createMemoryRateStore();
    const old = quote({ effectiveDate: "2026-10-16", fetchedAt: NOW - 86_400_000 });
    await store.set(old);
    const fetchFn: NbpFetch = async () => {
      throw new TypeError("offline");
    };

    // Act
    const refresh = await refreshNbpRates(["USD"], { store, fetchFn, now: NOW });
    const lookup = await getRate("USD", { store, now: "2026-10-19", maxAgeHours: 24 });

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
    const results = await refreshNbpRates(["USD", "JPY"], { store, fetchFn, now: NOW });

    // Assert
    expect(results.get("USD")).toMatchObject({ ok: false, error: { code: "storage-error" } });
    expect(results.get("JPY")).toMatchObject({ ok: true, value: { mid: "0.024574" } });
    expect(await memory.getAll()).toHaveLength(1);
  });
});
