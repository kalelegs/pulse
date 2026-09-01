import { EWeatherErrorCode, type TWeatherReport } from '@/lib/weather/types';

/** "Santa Clara, California" — the shortest phrase that still disambiguates. */
const placePhrase = (report: TWeatherReport): string =>
  [report.location.name, report.location.region].filter(Boolean).join(', ');

/**
 * The one or two sentences the assistant should actually say out loud.
 *
 * Deliberately short and free of every number that is already visible on the
 * card. The card carries humidity, wind, the day-by-day strip and the follow-up
 * chips; reading those aloud would make the assistant sound like a screen
 * reader. Speech gets the headline, the eyes get the detail.
 *
 * @param report The resolved weather report.
 */
export const describeReport = (report: TWeatherReport): string => {
  const { current, temperatureSymbol: symbol } = report;
  const today = report.forecast[0];
  const range = today ? ` High ${today.max}${symbol}, low ${today.min}${symbol}.` : '';
  // Other places share this name, so the spoken answer must name the region it used.
  const ambiguity = report.location.alternatives.length
    ? ` Name the region out loud, since other places are also called ${report.location.name}.`
    : '';

  return [
    `It is ${current.temperature}${symbol} and ${current.condition.label.toLowerCase()} in ${placePhrase(report)}.`,
    range,
    ambiguity,
    ' The full card — humidity, wind and the coming days — is already on screen. Say one short sentence about it and never read it out item by item.',
  ].join('');
};

/**
 * What the assistant should say when a lookup fails.
 *
 * Every branch is a sentence a person can act on, so the model never has to
 * invent an explanation for an error it cannot see.
 *
 * @param code Why the lookup failed.
 * @param city The place the user asked about.
 */
export const summariseFailure = (code: EWeatherErrorCode, city: string): string => {
  switch (code) {
    case EWeatherErrorCode.NOT_FOUND:
      return `Tell the user you could not find a place called "${city}" and ask them to confirm the city and state or country.`;
    case EWeatherErrorCode.TIMEOUT:
      return `Tell the user the weather service is slow to respond right now and offer to try "${city}" again.`;
    case EWeatherErrorCode.NETWORK:
      return `Tell the user you could not reach the weather service and offer to try "${city}" again in a moment.`;
    case EWeatherErrorCode.UPSTREAM:
      return `Tell the user the weather service returned an error for "${city}" and offer to try again shortly.`;
    case EWeatherErrorCode.MALFORMED:
    default:
      return `Tell the user the weather service returned incomplete data for "${city}" and offer to try again.`;
  }
};
