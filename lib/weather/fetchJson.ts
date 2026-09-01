import { EWeatherErrorCode } from '@/lib/weather/types';

/** How long a single upstream call may take before we give up on it. */
const REQUEST_TIMEOUT_MS = 8_000;

/** A JSON fetch that reports failure as data instead of throwing. */
export type TFetchJsonResult<TPayload> =
  { ok: true; data: TPayload } | { ok: false; code: EWeatherErrorCode; message: string };

/**
 * Fetches JSON with a hard timeout, mapping every failure mode onto an
 * `EWeatherErrorCode`.
 *
 * A realtime voice turn is blocked while a tool runs, so an upstream that hangs
 * would leave the assistant silent indefinitely. The abort budget is what keeps
 * a bad network into a spoken apology rather than dead air.
 *
 * @param url Fully qualified request URL.
 * @param label Human name of the upstream, used in the failure message.
 */
export const fetchJson = async <TPayload>(
  url: string,
  label: string,
): Promise<TFetchJsonResult<TPayload>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      return {
        ok: false,
        code: EWeatherErrorCode.UPSTREAM,
        message: `The ${label} service responded with status ${response.status}.`,
      };
    }

    return { ok: true, data: (await response.json()) as TPayload };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        code: EWeatherErrorCode.TIMEOUT,
        message: `The ${label} service did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds.`,
      };
    }

    return {
      ok: false,
      code: EWeatherErrorCode.NETWORK,
      message: `Could not reach the ${label} service.`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
