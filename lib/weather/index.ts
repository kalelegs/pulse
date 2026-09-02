/**
 * Weather domain layer.
 *
 * Everything outside `lib/weather` imports from this barrel and nothing deeper —
 * no URLs, no provider payload shapes, no WMO codes leak past it. The tool sees
 * `weatherProvider` plus the two speech helpers; the spec builder and the
 * showcase fixtures see the report types and `resolveCondition`. Swapping
 * providers is a change to the one line at the bottom.
 */
import { openMeteoProvider } from '@/lib/weather/openMeteo';
import type { TWeatherProvider } from '@/lib/weather/types';

export { resolveCondition } from '@/lib/weather/conditions';
export { describeReport, summariseFailure } from '@/lib/weather/summary';
export { EWeatherErrorCode } from '@/lib/weather/types';
export type { TForecastDay, TWeatherReport } from '@/lib/weather/types';

/** The provider the app actually uses. Point this at another implementation to swap sources. */
export const weatherProvider: TWeatherProvider = openMeteoProvider;
