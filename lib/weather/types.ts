import type { TIconName } from '@/lib/json-render/iconNames';

/**
 * Temperature scale a report is requested in. The app is US-facing, so
 * `fahrenheit` is the default everywhere; the model may override per call.
 */
export type TTemperatureUnit = 'celsius' | 'fahrenheit';

/** A WMO weather code resolved into something both a human and a block can read. */
export type TWeatherCondition = {
  /** Raw WMO `weather_code` as returned by the provider. */
  code: number;
  /** Human label, sentence case — "Partly cloudy", "Heavy snow showers". */
  label: string;
  /** Catalog icon that depicts the condition, already resolved for day/night. */
  icon: TIconName;
};

/** The place a report is about, as resolved by geocoding. */
export type TWeatherLocation = {
  /** City / place name — "Santa Clara". */
  name: string;
  /** First-level administrative area — "California". Null when the provider has none. */
  region: string | null;
  /** Country name — "United States". Null when the provider has none. */
  country: string | null;
  latitude: number;
  longitude: number;
  /**
   * IANA timezone the forecast days are expressed in — "America/Los_Angeles".
   * Null when neither the geocoder nor the forecast provider reported one.
   */
  timezone: string | null;
  /**
   * Other places that matched the same query, formatted for display.
   * Non-empty means the query was ambiguous and the first match was assumed.
   */
  alternatives: string[];
};

/** Conditions right now. */
export type TWeatherCurrent = {
  /** Rounded to whole degrees in the requested unit. */
  temperature: number;
  /** "Feels like", rounded to whole degrees in the requested unit. */
  apparentTemperature: number;
  /** Relative humidity, 0-100. */
  humidity: number;
  /** Rounded wind speed in `TWeatherReport.windUnit`. */
  windSpeed: number;
  /** Wind direction in degrees, meteorological convention (0 = from the north). */
  windDirection: number;
  /** 16-point compass abbreviation for `windDirection` — "WNW". */
  windCompass: string;
  /** True between local sunrise and sunset. Drives the day/night icon variant. */
  isDay: boolean;
  condition: TWeatherCondition;
};

/** One day of the daily forecast. */
export type TForecastDay = {
  /** ISO calendar date, `YYYY-MM-DD`, in the location's timezone. */
  date: string;
  /** Short weekday label for that date — "Mon". */
  weekday: string;
  condition: TWeatherCondition;
  /** Daily minimum, rounded, in the requested unit. */
  min: number;
  /** Daily maximum, rounded, in the requested unit. */
  max: number;
};

/** Everything the UI and the spoken summary need about one place. */
export type TWeatherReport = {
  location: TWeatherLocation;
  unit: TTemperatureUnit;
  /** Display symbol for `unit` — "°F" or "°C". */
  temperatureSymbol: string;
  /** Display unit the wind speed is already expressed in. */
  windUnit: string;
  current: TWeatherCurrent;
  /** Today first, then the following days. */
  forecast: TForecastDay[];
  /** ISO timestamp of when the report was fetched. */
  fetchedAt: string;
};

/** Why a lookup failed. Callers branch on this instead of parsing message strings. */
export enum EWeatherErrorCode {
  /** Geocoding returned no match for the query. */
  NOT_FOUND = 'not_found',
  /** The request never completed — offline, DNS, CORS, abort. */
  NETWORK = 'network',
  /** The provider answered with a non-2xx status. */
  UPSTREAM = 'upstream',
  /** The provider answered, but the payload was missing fields we require. */
  MALFORMED = 'malformed',
  /** The provider did not answer within the request budget. */
  TIMEOUT = 'timeout',
}

/** Result of a weather lookup. Discriminated on `ok`. */
export type TWeatherResult =
  { ok: true; report: TWeatherReport } | { ok: false; code: EWeatherErrorCode; message: string };

/** What the caller asks a provider for. */
export type TWeatherQuery = {
  /** Free-text place name as the user said it. */
  city: string;
  /**
   * Optional state / province / country qualifier used to disambiguate `city`.
   * Without it the provider's own ranking (plus a US bias) decides.
   */
  region?: string | null;
  /** Scale to request the numbers in. */
  unit: TTemperatureUnit;
  /** How many days of daily forecast to include, today inclusive. Defaults to 5. */
  forecastDays?: number;
};

/**
 * The weather source, behind an interface.
 *
 * `tools/weather.tsx` and `lib/spec-builders/weather.ts` only ever see
 * `TWeatherReport`, so swapping Open-Meteo for a keyed service is a one-file
 * change: implement this type and export it from `lib/weather/index.ts`.
 */
export type TWeatherProvider = {
  /** Stable identifier for logs and debugging — "open-meteo". */
  readonly name: string;
  /** Resolves the query to a report, or to a typed failure. Never throws. */
  getReport: (query: TWeatherQuery) => Promise<TWeatherResult>;
};
