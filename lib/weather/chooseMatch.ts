/** One geocoding candidate, narrowed to the fields the picker reasons about. */
export type TGeocodingMatch = {
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
};

/**
 * Country the app assumes when the user names a city without qualifying it.
 * Pulse speaks US English and defaults to Fahrenheit, so its users are American.
 */
export const DEFAULT_COUNTRY_CODE = 'US';

/**
 * How prominent the preferred-country candidate must be, relative to the
 * globally top-ranked one, before it wins.
 *
 * Open-Meteo ranks purely by population, which is wrong for a US audience often
 * enough to matter: "Santa Clara" resolves to Santa Clara, Cuba (250k) ahead of
 * Santa Clara, California (126k). Blindly preferring the US would be worse
 * still — it turns "Paris" into Paris, Texas (25k vs 2.1m). The ratio is the
 * line between the two: at 0.25 the Californian Santa Clara wins on 50% of
 * Cuba's population, while Paris, Texas loses on 1%.
 */
const PREFERENCE_POPULATION_RATIO = 0.25;

/** Lowercases and strips accents so "San José" and "San Jose" compare equal. */
const normalise = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const matchesRegion = (match: TGeocodingMatch, region: string): boolean => {
  const target = normalise(region);

  return [match.admin1, match.country, match.country_code]
    .filter((value): value is string => Boolean(value))
    .some((value) => {
      const candidate = normalise(value);

      return candidate === target || candidate.startsWith(target) || target.startsWith(candidate);
    });
};

/**
 * True when a candidate carries the same place name, ignoring case and accents.
 *
 * Used both to bias the country preference and to decide whether a query was
 * genuinely ambiguous — a search for "Santa Clara" returns "Santa Clara La
 * Laguna" too, and that is a different place, not a rival reading.
 */
export const isSameName = (match: TGeocodingMatch, city: string): boolean =>
  Boolean(match.name) && normalise(match.name as string) === normalise(city);

/**
 * Picks the candidate the user most likely meant.
 *
 * 1. An explicit region wins outright — "Santa Clara, Cuba" must resolve to Cuba.
 * 2. Otherwise the top candidate in the preferred country wins, but only when
 *    it is a comparably prominent place (see `PREFERENCE_POPULATION_RATIO`).
 * 3. Otherwise the provider's own ranking stands.
 *
 * @param matches Candidates in provider rank order.
 * @param city The place name as the user said it.
 * @param region Optional state / province / country qualifier from the caller.
 */
export const chooseMatch = (
  matches: TGeocodingMatch[],
  city: string,
  region?: string | null,
): TGeocodingMatch | undefined => {
  const [best] = matches;

  if (!best) {
    return undefined;
  }

  if (region) {
    return matches.find((match) => matchesRegion(match, region)) ?? best;
  }

  const preferred = matches.find(
    (match) => match.country_code === DEFAULT_COUNTRY_CODE && isSameName(match, city),
  );

  if (!preferred || preferred === best) {
    return best;
  }

  const bestPopulation = best.population ?? 0;
  const preferredPopulation = preferred.population ?? 0;

  return preferredPopulation >= bestPopulation * PREFERENCE_POPULATION_RATIO ? preferred : best;
};
