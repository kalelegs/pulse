import { EWeatherErrorCode } from '@/lib/weather/types';

/** How long a single upstream call may take before we give up on it. */
const REQUEST_TIMEOUT_MS = 8_000;

/** A JSON fetch that reports failure as data instead of throwing. */
export type TFetchJsonResult<TPayload> =
  { ok: true; data: TPayload } | { ok: false; code: EWeatherErrorCode; message: string };

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

const timeoutFailure = (label: string): TFetchJsonResult<never> => ({
  ok: false,
  code: EWeatherErrorCode.TIMEOUT,
  message: `The ${label} service did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds.`,
});

/**
 * Fetches JSON with a hard timeout, mapping every failure mode onto an
 * `EWeatherErrorCode`.
 *
 * A realtime voice turn is blocked while a tool runs, so an upstream that hangs
 * would leave the assistant silent indefinitely. The abort budget is what turns
 * a bad network into a spoken apology rather than dead air.
 *
 * Transport and parsing are caught separately: a 200 whose body is not JSON is
 * the provider misbehaving (`MALFORMED`), not the network (`NETWORK`), and the
 * spoken apology differs.
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
  let response: Response;

  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    clearTimeout(timeoutId);

    return isAbort(error)
      ? timeoutFailure(label)
      : {
          ok: false,
          code: EWeatherErrorCode.NETWORK,
          message: `Could not reach the ${label} service.`,
        };
  }

  try {
    if (!response.ok) {
      return {
        ok: false,
        code: EWeatherErrorCode.UPSTREAM,
        message: `The ${label} service responded with status ${response.status}.`,
      };
    }

    return { ok: true, data: (await response.json()) as TPayload };
  } catch (error) {
    // The body can still time out mid-read; anything else is an unparseable body.
    return isAbort(error)
      ? timeoutFailure(label)
      : {
          ok: false,
          code: EWeatherErrorCode.MALFORMED,
          message: `The ${label} service returned a response that was not valid JSON.`,
        };
  } finally {
    clearTimeout(timeoutId);
  }
};
