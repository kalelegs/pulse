/**
 * Weather domain layer.
 *
 * The tool and the spec builder import `weatherProvider` and `TWeatherReport`
 * from here and nothing else — no URLs, no provider payload shapes, no WMO
 * codes leak past this barrel. Swapping providers is a change to the one line
 * below.
 */
export { resolveCondition } from '@/lib/weather/conditions';
export { openMeteoProvider } from '@/lib/weather/openMeteo';
export { describeReport, summariseFailure } from '@/lib/weather/summary';

export type {
  TForecastDay,
  TTemperatureUnit,
  TWeatherCondition,
  TWeatherCurrent,
  TWeatherLocation,
  TWeatherProvider,
  TWeatherQuery,
  TWeatherReport,
  TWeatherResult,
} from '@/lib/weather/types';
export { EWeatherErrorCode } from '@/lib/weather/types';

import { openMeteoProvider } from '@/lib/weather/openMeteo';
import type { TWeatherProvider } from '@/lib/weather/types';

/** The provider the app actually uses. Point this at another implementation to swap sources. */
export const weatherProvider: TWeatherProvider = openMeteoProvider;
