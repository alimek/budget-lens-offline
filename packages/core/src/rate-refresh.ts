import type { CurrencyCode } from "./currency";
import { isNewerTableDue, isStoredRate, type RateResult, type StoredRate } from "./exchange-rates";
import { fetchNbpRates, type NbpFetch } from "./nbp-client";

/** Minimum time between NBP retries while today's table is still unpublished (e.g. on a weekday morning). */
const RETRY_INTERVAL_MS = 3_600_000;

import type { RateStore } from "./rate-store";

async function recentNbpRate(
  store: RateStore,
  currency: CurrencyCode,
  now: number,
  today: string,
): Promise<RateResult<StoredRate | undefined>> {
  try {
    const cached = (await store.get(currency)).find(
      (rate) => isStoredRate(rate) && rate.currency === currency && rate.source === "nbp",
    );
    // Skip when the cached table is the newest one a business day can have, or when it was fetched within the
    // retry interval (a newer table may simply not be published yet).
    const recent =
      cached !== undefined &&
      (!isNewerTableDue(cached.effectiveDate, today) ||
        (cached.fetchedAt <= now && now - cached.fetchedAt < RETRY_INTERVAL_MS));
    return { ok: true, value: recent ? cached : undefined };
  } catch {
    return { ok: false, error: { code: "storage-error", currency } };
  }
}

async function saveNbpRate(store: RateStore, rate: StoredRate): Promise<RateResult<StoredRate>> {
  try {
    await store.set(rate);
    return { ok: true, value: rate };
  } catch {
    return { ok: false, error: { code: "storage-error", currency: rate.currency } };
  }
}

/**
 * Explicit app-open operation: at most one table request (bounded by `timeoutMs`, default 10 s), no clock or
 * background work. `now` is injected epoch milliseconds; `today` is the app's local `YYYY-MM-DD`.
 */
export async function refreshNbpRates(
  currencies: readonly CurrencyCode[],
  options: {
    readonly store: RateStore;
    readonly fetchFn: NbpFetch;
    readonly now: number;
    readonly today: string;
    readonly timeoutMs?: number;
  },
): Promise<ReadonlyMap<CurrencyCode, RateResult<StoredRate>>> {
  const { store, fetchFn, now, today } = options;
  if (!Number.isSafeInteger(now) || now < 0) throw new RangeError("invalid-fetch-time");
  isNewerTableDue(today, today);
  const results = new Map<CurrencyCode, RateResult<StoredRate>>();
  const due: CurrencyCode[] = [];
  for (const currency of new Set(currencies)) {
    if (currency === "PLN") continue;
    const cached = await recentNbpRate(store, currency, now, today);
    if (!cached.ok) results.set(currency, cached);
    else if (cached.value !== undefined) results.set(currency, { ok: true, value: cached.value });
    else due.push(currency);
  }
  const fetched = await fetchNbpRates(
    due,
    fetchFn,
    options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs },
  );
  for (const [currency, result] of fetched) {
    if (!result.ok) {
      results.set(currency, result);
      continue;
    }
    const rate: StoredRate = { ...result.value, fetchedAt: now };
    results.set(currency, await saveNbpRate(store, rate));
  }
  return results;
}
