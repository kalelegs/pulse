import { resolveCondition } from '@/lib/weather/conditions';
import { fetchJson } from '@/lib/weather/fetchJson';
import {
  roundValue,
  temperatureSymbol,
  toCompassPoint,
  weekdayLabel,
  windSpeedParam,
  windUnitFor,
} from '@/lib/weather/format';
import { geocodeCity } from '@/lib/weather/geocode';
import {
  EWeatherErrorCode,
  type TForecastDay,
  type TWeatherLocation,
  type TWeatherProvider,
  type TWeatherQuery,
  type TWeatherResult,
} from '@/lib/weather/types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'is_day',
].join(',');

const DAILY_FIELDS = ['weather_code', 'temperature_2m_max', 'temperature_2m_min'].join(',');

const DEFAULT_FORECAST_DAYS = 5;

type TCurrentPayload = {
  temperature_2m?: number;
  apparent_temperature?: number;
  relative_humidity_2m?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  is_day?: number;
};

type TDailyPayload = {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
};

type TForecastPayload = {
  current?: TCurrentPayload;
  daily?: TDailyPayload;
  timezone?: string;
};

/** Builds the forecast request URL. Units are always explicit — never provider defaults. */
const buildForecastUrl = (location: TWeatherLocation, query: TWeatherQuery): string => {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: CURRENT_FIELDS,
    daily: DAILY_FIELDS,
    temperature_unit: query.unit,
    wind_speed_unit: windSpeedParam(query.unit),
    precipitation_unit: query.unit === 'celsius' ? 'mm' : 'inch',
    timezone: 'auto',
    forecast_days: String(query.forecastDays ?? DEFAULT_FORECAST_DAYS),
  });

  return `${FORECAST_URL}?${params.toString()}`;
};

/** Zips the provider's column-oriented `daily` arrays into row-oriented days. */
const toForecastDays = (daily: TDailyPayload | undefined): TForecastDay[] => {
  const dates = daily?.time ?? [];

  return dates.map((date, index) => ({
    date,
    weekday: weekdayLabel(date),
    // Daily codes describe the whole day, so they always use the daytime icon.
    condition: resolveCondition(daily?.weather_code?.[index] ?? -1, true),
    min: roundValue(daily?.temperature_2m_min?.[index] ?? Number.NaN),
    max: roundValue(daily?.temperature_2m_max?.[index] ?? Number.NaN),
  }));
};

/**
 * Open-Meteo weather provider.
 *
 * Chosen because it needs no API key and no signup, which keeps this reference
 * architecture runnable by anyone who clones it. Everything downstream — the
 * tool, the spec builder, the spoken summary — depends only on
 * `TWeatherProvider`, so replacing this with a keyed commercial service means
 * writing one new file and changing one export in `lib/weather/index.ts`.
 */
export const openMeteoProvider: TWeatherProvider = {
  name: 'open-meteo',

  getReport: async (query: TWeatherQuery): Promise<TWeatherResult> => {
    const geocoded = await geocodeCity(query.city, query.region);

    if (!geocoded.ok) {
      return geocoded;
    }

    const forecast = await fetchJson<TForecastPayload>(
      buildForecastUrl(geocoded.location, query),
      'weather',
    );

    if (!forecast.ok) {
      return forecast;
    }

    const current = forecast.data.current;

    if (!current || typeof current.temperature_2m !== 'number') {
      return {
        ok: false,
        code: EWeatherErrorCode.MALFORMED,
        message: `No current conditions were returned for ${geocoded.location.name}.`,
      };
    }

    const isDay = current.is_day !== 0;
    const windDirection = current.wind_direction_10m ?? 0;

    return {
      ok: true,
      report: {
        location: { ...geocoded.location, timezone: forecast.data.timezone ?? 'auto' },
        unit: query.unit,
        temperatureSymbol: temperatureSymbol(query.unit),
        windUnit: windUnitFor(query.unit),
        current: {
          temperature: roundValue(current.temperature_2m),
          apparentTemperature: roundValue(current.apparent_temperature ?? current.temperature_2m),
          humidity: roundValue(current.relative_humidity_2m ?? Number.NaN),
          windSpeed: roundValue(current.wind_speed_10m ?? Number.NaN),
          windDirection,
          windCompass: toCompassPoint(windDirection),
          isDay,
          condition: resolveCondition(current.weather_code ?? -1, isDay),
        },
        forecast: toForecastDays(forecast.data.daily),
        fetchedAt: new Date().toISOString(),
      },
    };
  },
};
