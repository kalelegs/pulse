import type { TTemperatureUnit } from '@/lib/weather/types';

const COMPASS_POINTS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
] as const;

/**
 * Converts a meteorological wind bearing into a 16-point compass abbreviation.
 *
 * @param degrees Direction the wind blows *from*, 0-360.
 */
export const toCompassPoint = (degrees: number): string => {
  const normalised = ((degrees % 360) + 360) % 360;

  return COMPASS_POINTS[Math.round(normalised / 22.5) % 16];
};

/** Rounds to whole units, mapping non-finite input to 0 so display never shows `NaN`. */
export const roundValue = (value: number): number =>
  Number.isFinite(value) ? Math.round(value) : 0;

/** Display symbol for a temperature unit. */
export const temperatureSymbol = (unit: TTemperatureUnit): string =>
  unit === 'celsius' ? '°C' : '°F';

/** Wind speed unit paired with a temperature scale — mph for °F, km/h for °C. */
export const windUnitFor = (unit: TTemperatureUnit): string =>
  unit === 'celsius' ? 'km/h' : 'mph';

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' });

/**
 * Short weekday label for an ISO `YYYY-MM-DD` date.
 *
 * Parsed as UTC midnight and formatted in UTC so the label can never slip a day
 * because of the viewer's own timezone — the date string is already local to the
 * forecast location.
 */
export const weekdayLabel = (isoDate: string): string => {
  const parsed = new Date(`${isoDate}T00:00:00Z`);

  return Number.isNaN(parsed.getTime()) ? isoDate : WEEKDAY_FORMAT.format(parsed);
};
