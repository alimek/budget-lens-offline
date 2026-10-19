/**
 * Characterization tests for the legacy NBP client (exchange-rates/refresh.ts):
 * what gets stored, when a refresh fails, and how a refreshed rate values savings.
 */
import { describe, expect, it, vi } from "vitest";
import { nbpResponses } from "./fixtures";
import { useFrozenClock } from "./helpers";
import {
  refreshAllExchangeRates,
  refreshExchangeRate,
  SUPPORTED_CURRENCIES,
  type UpsertExchangeRate,
} from "./legacy/exchange-rates";
import { valueInPlnFromCurrency } from "./legacy/format";

const NOW = "2026-10-18T13:00:00.000Z"; // Sunday – NBP publishes no table on weekends
useFrozenClock(NOW, "Europe/Warsaw");

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function fetchReturning(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse(body, status)));
}

function upsertEchoing() {
  return vi.fn<UpsertExchangeRate>((row) => Promise.resolve({ data: row, error: null }));
}

describe("refreshExchangeRate", () => {
  it("stores the latest mid with the table's effectiveDate and the sync time", async () => {
    // Arrange
    const upsert = upsertEchoing();
    const fetchFn = fetchReturning(nbpResponses.usd);

    // Act
    const rate = await refreshExchangeRate(upsert, "usd", fetchFn);

    // Assert
    expect(upsert).toHaveBeenCalledWith(
      { currency: "USD", rate: 3.6512, effective_date: "2026-10-16", updated_at: NOW },
      { onConflict: "currency" },
    );
    // Friday's table date stays separate from Sunday's sync time.
    expect(rate).toEqual({
      currency: "USD",
      rate: 3.6512,
      effectiveDate: "2026-10-16",
      updatedAt: NOW,
    });
  });

  it("rejects malformed NBP responses without writing", async () => {
    // Arrange
    const upsert = upsertEchoing();
    const malformed = [
      nbpResponses.emptyRates,
      nbpResponses.zeroMid,
      nbpResponses.stringMid,
      nbpResponses.missingEffectiveDate,
    ];

    // Act
    const results = await Promise.allSettled(
      malformed.map((body) => refreshExchangeRate(upsert, "USD", fetchReturning(body))),
    );

    // Assert
    for (const result of results) {
      expect(result).toMatchObject({
        status: "rejected",
        reason: new Error("NBP response for USD is invalid"),
      });
    }
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects HTTP errors such as an unknown currency without writing", async () => {
    // Arrange
    const upsert = upsertEchoing();
    const notFound = fetchReturning("Not Found", 404);

    // Act
    const refresh = refreshExchangeRate(upsert, "xyz", notFound);

    // Assert
    await expect(refresh).rejects.toThrow("NBP request for XYZ failed (404)");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("propagates network errors unchanged", async () => {
    // LEGACY: no offline fallback – fixed in #8: getRate retains cached quotes (src/exchange-rates.test.ts).
    // Arrange
    const offline = vi.fn<typeof fetch>(() => Promise.reject(new TypeError("fetch failed")));

    // Act
    const refresh = refreshExchangeRate(upsertEchoing(), "USD", offline);

    // Assert
    await expect(refresh).rejects.toThrow(new TypeError("fetch failed"));
  });

  it("rejects when the store write fails", async () => {
    // Arrange
    const failingUpsert = vi.fn<UpsertExchangeRate>(() =>
      Promise.resolve({ data: null, error: { message: "database unavailable" } }),
    );

    // Act
    const refresh = refreshExchangeRate(failingUpsert, "USD", fetchReturning(nbpResponses.usd));

    // Assert
    await expect(refresh).rejects.toThrow("Could not upsert USD exchange rate");
  });
});

describe("refreshAllExchangeRates", () => {
  it("refreshes the hard-coded currency list", async () => {
    // LEGACY: fixed list – fixed in #8: requiredRateCurrencies reads Settings (src/exchange-rates.test.ts).
    // Arrange
    const upsert = upsertEchoing();

    // Act
    const rates = await refreshAllExchangeRates(upsert, fetchReturning(nbpResponses.usd));

    // Assert
    expect(rates.map((r) => r.currency)).toEqual(["USD", "EUR", "GBP", "CHF", "JPY"]);
    expect(SUPPORTED_CURRENCIES).toHaveLength(5);
  });

  it("fails as a whole when a single currency fails", async () => {
    // LEGACY: Promise.all – fixed in #8: refreshNbpRates keeps successes (src/exchange-rates.test.ts).
    // Arrange
    const fetchFn = vi.fn<typeof fetch>((input) =>
      Promise.resolve(
        String(input).includes("/CHF/")
          ? jsonResponse("Service Unavailable", 503)
          : jsonResponse(nbpResponses.usd),
      ),
    );

    // Act
    const refreshAll = refreshAllExchangeRates(upsertEchoing(), fetchFn);

    // Assert
    await expect(refreshAll).rejects.toThrow("NBP request for CHF failed (503)");
  });
});

describe("JPY valuation", () => {
  it("values JPY savings with the per-unit NBP mid", async () => {
    // Arrange: NBP table A quotes JPY per 1 unit (202/A/NBP/2026: mid 0.024574).
    const fetchFn = fetchReturning(nbpResponses.jpy);

    // Act
    const rate = await refreshExchangeRate(upsertEchoing(), "JPY", fetchFn);
    const valueInPln = valueInPlnFromCurrency("10000", rate.rate);

    // Assert
    expect(rate.rate).toBe(0.024574);
    expect(valueInPln).toBe("245.74");
  });
});
