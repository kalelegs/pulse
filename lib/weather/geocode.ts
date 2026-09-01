import { chooseMatch, isSameName, type TGeocodingMatch } from '@/lib/weather/chooseMatch';
import { fetchJson } from '@/lib/weather/fetchJson';
import { EWeatherErrorCode, type TWeatherLocation } from '@/lib/weather/types';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** How many candidates we ask for. Extras become the ambiguity hint, not extra requests. */
const CANDIDATE_COUNT = 8;

type TGeocodingPayload = { results?: TGeocodingMatch[] };

/** Outcome of resolving a free-text place name. Discriminated on `ok`. */
export type TGeocodeResult =
  | { ok: true; location: TWeatherLocation }
  | { ok: false; code: EWeatherErrorCode; message: string };

/** "Santa Clara, California, United States" — skipping the parts the provider omitted. */
const describeMatch = (match: TGeocodingMatch): string =>
  [match.name, match.admin1, match.country].filter(Boolean).join(', ');

/**
 * Resolves a place name to coordinates via Open-Meteo's keyless geocoding API.
 *
 * The candidate the user meant is picked by `chooseMatch`, not by taking the
 * provider's first row — see that module for why. Whichever candidates lost are
 * kept on the location as `alternatives`, so an ambiguous query still produces a
 * report and the caller can tell the user which place it used.
 *
 * @param city Free-text place name, as the user said it.
 * @param region Optional state / province / country qualifier.
 */
export const geocodeCity = async (
  city: string,
  region?: string | null,
): Promise<TGeocodeResult> => {
  const trimmed = city.trim();

  if (!trimmed) {
    return { ok: false, code: EWeatherErrorCode.NOT_FOUND, message: 'No place name was given.' };
  }

  const params = new URLSearchParams({
    name: trimmed,
    count: String(CANDIDATE_COUNT),
    language: 'en',
    format: 'json',
  });
  const response = await fetchJson<TGeocodingPayload>(
    `${GEOCODING_URL}?${params.toString()}`,
    'geocoding',
  );

  if (!response.ok) {
    return response;
  }

  const matches = response.data.results ?? [];
  const chosen = chooseMatch(matches, trimmed, region);

  if (!chosen || typeof chosen.latitude !== 'number' || typeof chosen.longitude !== 'number') {
    return {
      ok: false,
      code: EWeatherErrorCode.NOT_FOUND,
      message: `No place called "${[trimmed, region].filter(Boolean).join(', ')}" could be found.`,
    };
  }

  return {
    ok: true,
    location: {
      name: chosen.name ?? trimmed,
      region: chosen.admin1 ?? null,
      country: chosen.country ?? null,
      latitude: chosen.latitude,
      longitude: chosen.longitude,
      timezone: chosen.timezone ?? 'auto',
      // Only rival readings of the same name count as ambiguity — a search for
      // "Santa Clara" also returns "Santa Clara La Laguna", which is not one.
      alternatives: matches
        .filter((match) => match !== chosen && isSameName(match, trimmed))
        .map(describeMatch)
        .filter(Boolean),
    },
  };
};
