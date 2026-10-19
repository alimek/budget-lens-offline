import type { CurrencyCode } from "./currency";
import { isStoredRate, type RateResult, type StoredRate } from "./exchange-rates";
import { fetchNbpRates, type NbpFetch } from "./nbp-client";
import type { RateStore } from "./rate-store";

async function recentNbpRate(
  store: RateStore,
  currency: CurrencyCode,
  now: number,
): Promise<RateResult<StoredRate | undefined>> {
  try {
    const cached = (await store.get(currency)).find(
      (rate) => isStoredRate(rate) && rate.currency === currency && rate.source === "nbp",
    );
    const recent =
      cached !== undefined && cached.fetchedAt <= now && now - cached.fetchedAt < 86_400_000;
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

/** Explicit app-open operation: at most one table request, no clock, timer, or background work. */
export async function refreshNbpRates(
  currencies: readonly CurrencyCode[],
  options: { readonly store: RateStore; readonly fetchFn: NbpFetch; readonly now: number },
): Promise<ReadonlyMap<CurrencyCode, RateResult<StoredRate>>> {
  const { store, fetchFn, now } = options;
  if (!Number.isSafeInteger(now) || now < 0) throw new RangeError("invalid-fetch-time");
  const results = new Map<CurrencyCode, RateResult<StoredRate>>();
  const due: CurrencyCode[] = [];
  for (const currency of new Set(currencies)) {
    if (currency === "PLN") continue;
    const cached = await recentNbpRate(store, currency, now);
    if (!cached.ok) results.set(currency, cached);
    else if (cached.value !== undefined) results.set(currency, { ok: true, value: cached.value });
    else due.push(currency);
  }
  const fetched = await fetchNbpRates(due, fetchFn);
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
