import type { TIconName } from '@/components/json-render/blocks';
import type { TWeatherCondition } from '@/lib/weather/types';

/** One WMO code, its prose label and the catalog icons that depict it. */
type TConditionEntry = {
  label: string;
  /** Icon used while the sun is up. */
  day: TIconName;
  /** Icon used after dark. Same as `day` when the icon set has no night variant. */
  night: TIconName;
};

/**
 * The 28 WMO `weather_code` values Open-Meteo emits.
 *
 * Every icon is a `TIconName` from `components/json-render/icons.ts`, so a name
 * the curated set does not carry is a compile error rather than a blank square
 * in the rendered card. Only the clear/partly-clear codes have a meaningful
 * night variant — the icon set has `sun`/`moon` but no nocturnal rain or snow.
 */
const WMO_CONDITIONS: Record<number, TConditionEntry> = {
  0: { label: 'Clear sky', day: 'sun', night: 'moon' },
  1: { label: 'Mainly clear', day: 'sun', night: 'moon' },
  2: { label: 'Partly cloudy', day: 'cloudy', night: 'moon' },
  3: { label: 'Overcast', day: 'cloud', night: 'cloud' },
  45: { label: 'Fog', day: 'visibility', night: 'visibility' },
  48: { label: 'Freezing fog', day: 'visibility', night: 'visibility' },
  51: { label: 'Light drizzle', day: 'rain', night: 'rain' },
  53: { label: 'Drizzle', day: 'rain', night: 'rain' },
  55: { label: 'Heavy drizzle', day: 'rain', night: 'rain' },
  56: { label: 'Light freezing drizzle', day: 'rain', night: 'rain' },
  57: { label: 'Freezing drizzle', day: 'rain', night: 'rain' },
  61: { label: 'Light rain', day: 'rain', night: 'rain' },
  63: { label: 'Rain', day: 'rain', night: 'rain' },
  65: { label: 'Heavy rain', day: 'rain', night: 'rain' },
  66: { label: 'Light freezing rain', day: 'cold', night: 'cold' },
  67: { label: 'Freezing rain', day: 'cold', night: 'cold' },
  71: { label: 'Light snow', day: 'snow', night: 'snow' },
  73: { label: 'Snow', day: 'snow', night: 'snow' },
  75: { label: 'Heavy snow', day: 'snow', night: 'snow' },
  77: { label: 'Snow grains', day: 'snow', night: 'snow' },
  80: { label: 'Light rain showers', day: 'rain', night: 'rain' },
  81: { label: 'Rain showers', day: 'rain', night: 'rain' },
  82: { label: 'Violent rain showers', day: 'storm', night: 'storm' },
  85: { label: 'Light snow showers', day: 'snow', night: 'snow' },
  86: { label: 'Heavy snow showers', day: 'snow', night: 'snow' },
  95: { label: 'Thunderstorm', day: 'storm', night: 'storm' },
  96: { label: 'Thunderstorm with hail', day: 'storm', night: 'storm' },
  99: { label: 'Thunderstorm with heavy hail', day: 'storm', night: 'storm' },
};

const UNKNOWN_CONDITION: TConditionEntry = {
  label: 'Unknown conditions',
  day: 'cloud',
  night: 'cloud',
};

/**
 * Resolves a WMO weather code into a label plus a catalog icon.
 *
 * @param code WMO `weather_code` from the provider.
 * @param isDay Whether the sun is up at the location; picks the icon variant.
 */
export const resolveCondition = (code: number, isDay = true): TWeatherCondition => {
  const entry = WMO_CONDITIONS[code] ?? UNKNOWN_CONDITION;

  return { code, label: entry.label, icon: isDay ? entry.day : entry.night };
};
