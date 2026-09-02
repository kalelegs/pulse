import { resolveCondition, type TForecastDay, type TWeatherReport } from '@/lib/weather';

/**
 * Fixed `TWeatherReport`s for the showcase route.
 *
 * The page renders from these rather than from `weatherProvider`, so `/showcase`
 * is deterministic, offline-viewable and free of network latency — a reference
 * page that changes shape with the real weather is useless for spotting a
 * visual regression. Conditions still go through `resolveCondition()` so the
 * WMO code -> label -> icon mapping under test is the production one.
 */

/** One forecast day, with its condition resolved from the WMO code. */
const day = (
  weekday: string,
  date: string,
  code: number,
  max: number,
  min: number,
): TForecastDay => ({ date, weekday, condition: resolveCondition(code), min, max });

/**
 * Warm daytime case: clear sky, °F, apparent temperature above actual (so the
 * "feels like" cell resolves to the `hot` icon) and a five day strip.
 */
export const warmDayReport: TWeatherReport = {
  location: {
    name: 'Santa Clara',
    region: 'California',
    country: 'United States',
    latitude: 37.3541,
    longitude: -121.9552,
    timezone: 'America/Los_Angeles',
    alternatives: ['Santa Clara, Cuba', 'Santa Clara, Uruguay'],
  },
  unit: 'fahrenheit',
  temperatureSymbol: '°F',
  windUnit: 'mph',
  current: {
    temperature: 84,
    apparentTemperature: 88,
    humidity: 38,
    windSpeed: 9,
    windDirection: 295,
    windCompass: 'WNW',
    isDay: true,
    condition: resolveCondition(0, true),
  },
  forecast: [
    day('Mon', '2026-08-31', 0, 84, 61),
    day('Tue', '2026-09-01', 1, 86, 62),
    day('Wed', '2026-09-02', 2, 79, 58),
    day('Thu', '2026-09-03', 61, 74, 57),
    day('Fri', '2026-09-04', 3, 77, 59),
  ],
  fetchedAt: '2026-08-31T21:05:00.000Z',
};

/**
 * Cold night case: the same card with `isDay: false` (moon icon variants), °C,
 * negative values, a wind reading long enough to test the stats grid, and snow
 * conditions across the strip.
 */
export const coldNightReport: TWeatherReport = {
  location: {
    name: 'Reykjavík',
    region: 'Capital Region',
    country: 'Iceland',
    latitude: 64.1466,
    longitude: -21.9426,
    timezone: 'Atlantic/Reykjavik',
    alternatives: [],
  },
  unit: 'celsius',
  temperatureSymbol: '°C',
  windUnit: 'km/h',
  current: {
    temperature: -4,
    apparentTemperature: -11,
    humidity: 86,
    windSpeed: 34,
    windDirection: 22,
    windCompass: 'NNE',
    isDay: false,
    condition: resolveCondition(0, false),
  },
  forecast: [
    day('Mon', '2026-08-31', 71, -2, -9),
    day('Tue', '2026-09-01', 73, -1, -7),
    day('Wed', '2026-09-02', 3, 1, -4),
    day('Thu', '2026-09-03', 61, 2, -2),
    day('Fri', '2026-09-04', 75, 0, -5),
  ],
  fetchedAt: '2026-08-31T21:05:00.000Z',
};
