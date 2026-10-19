import { type CurrencyCode, isCurrencyCode } from "./currency";
import {
  isRateDate,
  isRateQuote,
  type RateError,
  type RateQuote,
  type RateResult,
} from "./exchange-rates";

/** Structural fetch contract: works without DOM, Node or Expo types. No global fetch is read. */
export type NbpFetch = (url: string) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}>;

const API = "https://api.nbp.pl/api/exchangerates";

/** Default limit for one NBP request; a hung request becomes `network-error` instead of blocking app open. */
export const NBP_TIMEOUT_MS = 10_000;

export interface NbpRequestOptions {
  /** Milliseconds before the request is abandoned and reported as `network-error`. */
  readonly timeoutMs?: number;
}

/** Every supported runtime (Hermes, Node) has timers; core keeps `types: []`, so they are typed structurally. */
const timers = globalThis as unknown as {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
};

/** Resolves to `undefined` after `ms`; `fetchFn` has no abort contract, so a timed-out request is only abandoned. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  let handle: unknown;
  const timeout = new Promise<undefined>((resolve) => {
    handle = timers.setTimeout(() => resolve(undefined), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    timers.clearTimeout(handle);
  }
}

function object(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function timeoutOf(options: NbpRequestOptions): number {
  const timeoutMs = options.timeoutMs ?? NBP_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new RangeError("invalid-timeout");
  return timeoutMs;
}

const NETWORK_ERROR: RateResult<never> = { ok: false, error: { code: "network-error" } };

/** A rejected or timed-out body read; parsed JSON is never `undefined`, so `undefined` means the timeout. */
async function readBody(
  response: Awaited<ReturnType<NbpFetch>>,
  timeoutMs: number,
): Promise<RateResult<unknown>> {
  try {
    const body = await withTimeout(response.json(), timeoutMs);
    return body === undefined ? NETWORK_ERROR : { ok: true, value: body };
  } catch {
    return { ok: false, error: { code: "invalid-response" } };
  }
}

async function request(
  url: string,
  fetchFn: NbpFetch,
  options: NbpRequestOptions,
): Promise<RateResult<unknown>> {
  const timeoutMs = timeoutOf(options);
  let response: Awaited<ReturnType<NbpFetch>> | undefined;
  try {
    response = await withTimeout(fetchFn(url), timeoutMs);
  } catch {
    return NETWORK_ERROR;
  }
  if (response === undefined) return NETWORK_ERROR;
  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: response.status === 404 ? "not-found" : "http-error",
        status: response.status,
      },
    };
  }
  return readBody(response, timeoutMs);
}

/** Preserve the API's printed decimal exactly, including small rates printed with an exponent. */
function midString(mid: unknown): string | undefined {
  if (typeof mid !== "number" || !Number.isFinite(mid) || mid <= 0) return undefined;
  const [digits = "", exponent = "0"] = String(mid).split("e");
  const [integer = "", fraction = ""] = digits.split(".");
  const all = integer + fraction;
  const point = integer.length + Number(exponent);
  if (point <= 0) return `0.${"0".repeat(-point)}${all}`;
  if (point >= all.length) return all + "0".repeat(point - all.length);
  return `${all.slice(0, point)}.${all.slice(point)}`;
}

function quote(
  currency: CurrencyCode,
  mid: unknown,
  effectiveDate: unknown,
): RateResult<RateQuote> {
  const rate = { currency, mid: midString(mid), effectiveDate, source: "nbp" };
  return isRateQuote(rate)
    ? { ok: true, value: rate }
    : { ok: false, error: { code: "invalid-response", currency } };
}

/** Latest individual table-A quote; never asks for history or today's unpublished table. */
export async function fetchNbpRate(
  currency: CurrencyCode,
  fetchFn: NbpFetch,
  options: NbpRequestOptions = {},
): Promise<RateResult<RateQuote>> {
  if (!isCurrencyCode(currency) || currency === "PLN") {
    return { ok: false, error: { code: "unsupported-currency" } };
  }
  const result = await request(`${API}/rates/A/${currency}/?format=json`, fetchFn, options);
  if (!result.ok) return { ok: false, error: { ...result.error, currency } };
  const body = object(result.value);
  const rates = body?.["rates"];
  const rate = Array.isArray(rates) && rates.length === 1 ? object(rates[0]) : undefined;
  if (body?.["table"] !== "A" || body["code"] !== currency || rate === undefined) {
    return { ok: false, error: { code: "invalid-response", currency } };
  }
  return quote(currency, rate["mid"], rate["effectiveDate"]);
}

interface NbpTable {
  readonly effectiveDate: string;
  readonly rates: readonly unknown[];
}

function parseTable(body: unknown): NbpTable | undefined {
  const table = Array.isArray(body) && body.length === 1 ? object(body[0]) : undefined;
  if (
    table?.["table"] !== "A" ||
    !isRateDate(table["effectiveDate"]) ||
    !Array.isArray(table["rates"])
  ) {
    return undefined;
  }
  return { effectiveDate: table["effectiveDate"], rates: table["rates"] };
}

function tableQuote(table: NbpTable, currency: CurrencyCode): RateResult<RateQuote> {
  if (!isCurrencyCode(currency)) return { ok: false, error: { code: "unsupported-currency" } };
  const matching = table.rates.map(object).filter((row) => row?.["code"] === currency);
  if (matching.length === 0) return { ok: false, error: { code: "not-found", currency } };
  const row = matching[0];
  if (matching.length !== 1 || row === undefined) {
    return { ok: false, error: { code: "invalid-response", currency } };
  }
  return quote(currency, row["mid"], table.effectiveDate);
}

function tableErrors(
  currencies: readonly CurrencyCode[],
  error: RateError,
): ReadonlyMap<CurrencyCode, RateResult<RateQuote>> {
  return new Map(
    currencies.map((currency) => [currency, { ok: false, error: { ...error, currency } }]),
  );
}

/** One current table request for the required set. A bad/missing currency cannot discard good quotes. */
export async function fetchNbpRates(
  currencies: readonly CurrencyCode[],
  fetchFn: NbpFetch,
  options: NbpRequestOptions = {},
): Promise<ReadonlyMap<CurrencyCode, RateResult<RateQuote>>> {
  const needed = [...new Set(currencies)].filter((currency) => currency !== "PLN");
  if (needed.length === 0) return new Map();
  const response = await request(`${API}/tables/A/?format=json`, fetchFn, options);
  if (!response.ok) return tableErrors(needed, response.error);
  const table = parseTable(response.value);
  if (table === undefined) return tableErrors(needed, { code: "invalid-response" });
  return new Map(needed.map((currency) => [currency, tableQuote(table, currency)]));
}
