import { type CurrencyCode, isCurrencyCode } from "./currency";
import {
  isRateDate,
  isRateQuote,
  type RateError,
  type RateQuote,
  type RateResult,
} from "./exchange-rates";

/** Structural `AbortSignal`: core keeps `types: []`, so DOM/Node types are not available. */
export interface AbortSignalLike {
  readonly aborted: boolean;
}

/**
 * Structural fetch contract: works without DOM, Node or Expo types. No global fetch is read. The global `fetch` of
 * RN/Hermes and Node fits as is; it must honour `signal`, which is aborted when the request times out.
 */
export type NbpFetch = (
  url: string,
  init: { readonly signal: AbortSignalLike },
) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}>;

const API = "https://api.nbp.pl/api/exchangerates";

/** Default limit for one NBP request; a hung request becomes `network-error` instead of blocking app open. */
export const NBP_TIMEOUT_MS = 10_000;

export interface NbpRequestOptions {
  /** Milliseconds before the request (response and body) is aborted and reported as `network-error`. */
  readonly timeoutMs?: number;
}

/** Timers and `AbortController` exist in every supported runtime (Hermes, Node); typed structurally. */
const runtime = globalThis as unknown as {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  AbortController: new () => { readonly signal: AbortSignalLike; abort(): void };
};

const TIMED_OUT = Symbol("timed-out");

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

/** Response and body share one signal and one deadline; an abort or the deadline is a `network-error`. */
async function exchange(
  url: string,
  fetchFn: NbpFetch,
  signal: AbortSignalLike,
  deadline: Promise<typeof TIMED_OUT>,
): Promise<RateResult<unknown>> {
  let response: Awaited<ReturnType<NbpFetch>> | typeof TIMED_OUT;
  try {
    response = await Promise.race([fetchFn(url, { signal }), deadline]);
  } catch {
    return NETWORK_ERROR;
  }
  if (response === TIMED_OUT) return NETWORK_ERROR;
  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: response.status === 404 ? "not-found" : "http-error",
        status: response.status,
      },
    };
  }
  try {
    const body = await Promise.race([response.json(), deadline]);
    return body === TIMED_OUT ? NETWORK_ERROR : { ok: true, value: body };
  } catch {
    // An aborted body read rejects with an `AbortError`; anything else is unreadable JSON.
    return signal.aborted ? NETWORK_ERROR : { ok: false, error: { code: "invalid-response" } };
  }
}

/** One `AbortController` and one timer per request; the timer is always cleared. */
async function request(
  url: string,
  fetchFn: NbpFetch,
  options: NbpRequestOptions,
): Promise<RateResult<unknown>> {
  const timeoutMs = timeoutOf(options);
  const controller = new runtime.AbortController();
  let handle: unknown;
  const deadline = new Promise<typeof TIMED_OUT>((resolve) => {
    handle = runtime.setTimeout(() => {
      controller.abort();
      resolve(TIMED_OUT);
    }, timeoutMs);
  });
  try {
    return await exchange(url, fetchFn, controller.signal, deadline);
  } finally {
    runtime.clearTimeout(handle);
  }
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
