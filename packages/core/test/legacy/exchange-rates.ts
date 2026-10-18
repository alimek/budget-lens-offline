/**
 * LEGACY REFERENCE – port of apps/web/src/lib/exchange-rates/refresh.ts from the old Budget Lens
 * repository. The Supabase client is replaced by a minimal `upsert` callback with the same contract
 * (resolves to `{ data, error }`); request, validation and error messages are unchanged.
 * Do not "fix" this file.
 */

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY"] as const;

export interface ExchangeRate {
  currency: string;
  rate: number;
  effectiveDate: string;
  updatedAt: string;
}

export interface ExchangeRateRow {
  currency: string;
  rate: number | string;
  effective_date: string;
  updated_at: string | null;
}

export type UpsertExchangeRate = (
  row: ExchangeRateRow,
  options: { onConflict: "currency" },
) => Promise<{ data: ExchangeRateRow | null; error: { message: string } | null }>;

interface NbpResponse {
  rates?: {
    effectiveDate?: string;
    mid?: number;
  }[];
}

function toExchangeRate(row: ExchangeRateRow): ExchangeRate {
  return {
    currency: row.currency,
    rate: Number(row.rate),
    effectiveDate: row.effective_date,
    updatedAt: row.updated_at ?? "",
  };
}

export async function refreshExchangeRate(
  upsert: UpsertExchangeRate,
  currency: string,
  fetchFn: typeof fetch,
): Promise<ExchangeRate> {
  const normalizedCurrency = currency.toUpperCase();
  const response = await fetchFn(
    `https://api.nbp.pl/api/exchangerates/rates/a/${normalizedCurrency}/?format=json`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`NBP request for ${normalizedCurrency} failed (${response.status})`);
  }

  const payload = (await response.json()) as NbpResponse;
  const latestRate = payload.rates?.[0];

  if (
    !latestRate ||
    typeof latestRate.mid !== "number" ||
    !Number.isFinite(latestRate.mid) ||
    latestRate.mid <= 0 ||
    typeof latestRate.effectiveDate !== "string" ||
    latestRate.effectiveDate.length === 0
  ) {
    throw new Error(`NBP response for ${normalizedCurrency} is invalid`);
  }

  const { data, error } = await upsert(
    {
      currency: normalizedCurrency,
      rate: latestRate.mid,
      effective_date: latestRate.effectiveDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "currency" },
  );

  // `|| !data` only narrows the type: Supabase `.single()` never returns null data without an error.
  if (error || !data) {
    throw new Error(`Could not upsert ${normalizedCurrency} exchange rate`);
  }

  return toExchangeRate(data);
}

export async function refreshAllExchangeRates(
  upsert: UpsertExchangeRate,
  fetchFn: typeof fetch,
): Promise<ExchangeRate[]> {
  return await Promise.all(
    SUPPORTED_CURRENCIES.map((currency) => refreshExchangeRate(upsert, currency, fetchFn)),
  );
}
