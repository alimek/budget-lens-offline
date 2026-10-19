import { type CurrencyCode, isCurrencyCode } from "./currency";
import {
  isRateStale,
  isStoredRate,
  type RateResult,
  type StoredRate,
  selectCurrentRates,
} from "./exchange-rates";

/** At most one current row per (currency, source); SQLite implements this contract in #92. */
export interface RateStore {
  get(currency: CurrencyCode): Promise<readonly StoredRate[]>;
  set(rate: StoredRate): Promise<void>;
  getAll(): Promise<readonly StoredRate[]>;
}

/** Isolated test/offline store. Copy on write/read prevents callers from changing cached values. */
export function createMemoryRateStore(): RateStore {
  const rows = new Map<string, StoredRate>();
  return {
    async get(currency) {
      return [...rows.values()]
        .filter((row) => row.currency === currency)
        .map((row) => ({ ...row }));
    },
    async set(rate) {
      if (!isStoredRate(rate)) throw new RangeError("invalid-rate");
      rows.set(`${rate.currency}:${rate.source}`, { ...rate });
    },
    async getAll() {
      return [...rows.values()].map((row) => ({ ...row }));
    },
  };
}

export interface CurrentRate {
  readonly currency: CurrencyCode;
  readonly mid: string;
  readonly effectiveDate: string;
  readonly source: StoredRate["source"] | "implicit";
  readonly stale: boolean;
}

/** Read only: app-open refresh is separate. Old rates remain available without a network connection. */
export async function getRate(
  currency: CurrencyCode,
  options: { readonly store: RateStore; readonly now: string; readonly maxAgeBusinessDays: number },
): Promise<RateResult<CurrentRate>> {
  const { store, now, maxAgeBusinessDays } = options;
  // Validate options even for PLN or a missing quote.
  isRateStale(now, now, maxAgeBusinessDays);
  if (!isCurrencyCode(currency)) return { ok: false, error: { code: "unsupported-currency" } };
  if (currency === "PLN") {
    return {
      ok: true,
      value: { currency, mid: "1", effectiveDate: now, source: "implicit", stale: false },
    };
  }
  let rates: readonly StoredRate[];
  try {
    rates = await store.get(currency);
  } catch {
    return { ok: false, error: { code: "storage-error", currency } };
  }
  if (!Array.isArray(rates)) return { ok: false, error: { code: "invalid-rate", currency } };
  // A malformed row of one source must not hide a valid row of the other source.
  const valid = rates.filter((rate) => isStoredRate(rate) && rate.currency === currency);
  const selected = selectCurrentRates(valid).get(currency);
  if (selected === undefined) {
    const code = valid.length < rates.length ? "invalid-rate" : "missing-rate";
    return { ok: false, error: { code, currency } };
  }
  return {
    ok: true,
    value: {
      currency,
      mid: selected.mid,
      effectiveDate: selected.effectiveDate,
      source: selected.source,
      stale: isRateStale(selected.effectiveDate, now, maxAgeBusinessDays),
    },
  };
}
