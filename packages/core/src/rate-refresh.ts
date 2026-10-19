import type { CurrencyCode } from "./currency";
import {
  isNewerTableDue,
  isStoredRate,
  type RateResult,
  type StoredRate,
  warsawDate,
} from "./exchange-rates";
import { fetchNbpRates, type NbpFetch } from "./nbp-client";
import type { RateStore } from "./rate-store";

/** Minimum time between NBP retries while today's table is still unpublished (e.g. on a weekday morning). */
const RETRY_INTERVAL_MS = 3_600_000;

async function cachedNbpRate(
  store: RateStore,
  currency: CurrencyCode,
): Promise<RateResult<StoredRate | undefined>> {
  try {
    const cached = (await store.get(currency)).find(
      (rate) => isStoredRate(rate) && rate.currency === currency && rate.source === "nbp",
    );
    return { ok: true, value: cached };
  } catch {
    return { ok: false, error: { code: "storage-error", currency } };
  }
}

/**
 * Due when nothing is cached, or when a newer table may exist (a business day after the cached `effectiveDate`, up
 * to Warsaw's today) and the row was not fetched within the retry interval.
 */
function isRefreshDue(cached: StoredRate | undefined, now: number, today: string): boolean {
  if (cached === undefined) return true;
  const fetchedRecently = cached.fetchedAt <= now && now - cached.fetchedAt < RETRY_INTERVAL_MS;
  return isNewerTableDue(cached.effectiveDate, today) && !fetchedRecently;
}

async function saveNbpRate(store: RateStore, rate: StoredRate): Promise<RateResult<StoredRate>> {
  try {
    await store.set(rate);
    return { ok: true, value: rate };
  } catch {
    return { ok: false, error: { code: "storage-error", currency: rate.currency } };
  }
}

/** Newer table wins: an older response (e.g. a stale proxy) never replaces the cached row; `fetchedAt` advances. */
function newestRate(cached: StoredRate | undefined, fetched: StoredRate): StoredRate {
  return cached !== undefined && cached.effectiveDate > fetched.effectiveDate
    ? { ...cached, fetchedAt: fetched.fetchedAt }
    : fetched;
}

interface RefreshPlan {
  readonly results: Map<CurrencyCode, RateResult<StoredRate>>;
  readonly cachedRows: Map<CurrencyCode, StoredRate>;
  readonly due: CurrencyCode[];
}

async function planRefresh(
  currencies: readonly CurrencyCode[],
  store: RateStore,
  now: number,
): Promise<RefreshPlan> {
  const today = warsawDate(new Date(now));
  const plan: RefreshPlan = { results: new Map(), cachedRows: new Map(), due: [] };
  for (const currency of new Set(currencies)) {
    if (currency === "PLN") continue;
    const cached = await cachedNbpRate(store, currency);
    if (!cached.ok) {
      plan.results.set(currency, cached);
    } else if (isRefreshDue(cached.value, now, today)) {
      plan.due.push(currency);
      if (cached.value !== undefined) plan.cachedRows.set(currency, cached.value);
    } else if (cached.value !== undefined) {
      plan.results.set(currency, { ok: true, value: cached.value });
    }
  }
  return plan;
}

/**
 * Explicit app-open operation: at most one table request (aborted after `timeoutMs`, default 10 s), no clock or
 * background work. `now` is injected epoch milliseconds; the gate uses its Europe/Warsaw date ({@link warsawDate}).
 * A response older than the cached table never replaces it; only `fetchedAt` advances for the retry throttle.
 */
export async function refreshNbpRates(
  currencies: readonly CurrencyCode[],
  options: {
    readonly store: RateStore;
    readonly fetchFn: NbpFetch;
    readonly now: number;
    readonly timeoutMs?: number;
  },
): Promise<ReadonlyMap<CurrencyCode, RateResult<StoredRate>>> {
  const { store, fetchFn, now } = options;
  if (!Number.isSafeInteger(now) || now < 0) throw new RangeError("invalid-fetch-time");
  const { results, cachedRows, due } = await planRefresh(currencies, store, now);
  const fetched = await fetchNbpRates(
    due,
    fetchFn,
    options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs },
  );
  for (const [currency, result] of fetched) {
    results.set(
      currency,
      result.ok
        ? await saveNbpRate(
            store,
            newestRate(cachedRows.get(currency), { ...result.value, fetchedAt: now }),
          )
        : result,
    );
  }
  return results;
}
