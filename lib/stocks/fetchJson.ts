import { EStockErrorCode } from '@/lib/stocks/types';

/** How long a single upstream call may take before we give up on it. */
const REQUEST_TIMEOUT_MS = 8_000;

/** A JSON fetch that reports failure as data instead of throwing. */
export type TFetchJsonResult<TPayload> =
  { ok: true; data: TPayload } | { ok: false; code: EStockErrorCode };

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

/** Maps an error status onto the code whose spoken apology fits it. */
const codeForStatus = (status: number): EStockErrorCode => {
  if (status === 404) {
    return EStockErrorCode.NOT_FOUND;
  }

  return status === 429 ? EStockErrorCode.RATE_LIMITED : EStockErrorCode.NETWORK;
};

/**
 * Fetches JSON with a hard timeout, mapping every failure mode onto an
 * `EStockErrorCode`.
 *
 * Same shape as `lib/weather/fetchJson.ts`, kept separate on purpose: the two
 * domains share no types, and this one also carries request headers (Yahoo
 * needs a browser-like `User-Agent`, Finnhub its token) and reads the status
 * code — a 404 from the chart endpoint is how Yahoo says "no such symbol".
 *
 * A realtime voice turn is blocked while a tool runs, so an upstream that hangs
 * would leave the assistant silent; the abort budget turns that into an apology.
 *
 * @param url Fully qualified request URL.
 * @param headers Extra request headers.
 */
export const fetchJson = async <TPayload>(
  url: string,
  headers: Record<string, string> = {},
): Promise<TFetchJsonResult<TPayload>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(url, { headers, signal: controller.signal, cache: 'no-store' });
  } catch (error) {
    clearTimeout(timeoutId);

    return { ok: false, code: isAbort(error) ? EStockErrorCode.TIMEOUT : EStockErrorCode.NETWORK };
  }

  try {
    if (!response.ok) {
      return { ok: false, code: codeForStatus(response.status) };
    }

    return { ok: true, data: (await response.json()) as TPayload };
  } catch (error) {
    // The body can still time out mid-read; anything else is an unparseable body.
    return {
      ok: false,
      code: isAbort(error) ? EStockErrorCode.TIMEOUT : EStockErrorCode.MALFORMED,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
