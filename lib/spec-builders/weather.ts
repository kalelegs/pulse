import { block, buildSpec } from '@/lib/spec-builders/builder';
import { followUpChips, forecastStrip, statsGrid } from '@/lib/spec-builders/weatherParts';
import type { TJsonRenderSpec } from '@/lib/json-render/types';
import type { TWeatherReport } from '@/lib/weather/types';

/** "California, United States" — whatever the geocoder actually gave us. */
const regionPhrase = (report: TWeatherReport): string =>
  [report.location.region, report.location.country].filter(Boolean).join(', ');

/**
 * The heading's subtitle: region only.
 *
 * Deliberately *not* prefixed with the condition. The condition already labels
 * the headline `MetricBlock` directly under the temperature, where it belongs —
 * printing it here too put "Clear sky" on the card twice, two lines apart.
 */
const subtitle = (report: TWeatherReport): string => regionPhrase(report);

/**
 * Root key for the card.
 *
 * Derived from the place rather than left to the builder's `card-1` default
 * purely for legibility: a spec dumped in the Events panel or a React tree
 * inspected in devtools says `weather-santa-clara` instead of `card-1`, which
 * is the difference between recognising a card at a glance and diffing it.
 *
 * Nothing depends on it being unique. `JsonRenderErrorBoundary` resets on the
 * spec *object identity*, never on `spec.root` — see `JsonRenderSurface` and
 * `components/json-render/README.md` — precisely because root keys repeat
 * across specs.
 */
const rootKey = (report: TWeatherReport): string =>
  `weather-${
    report.location.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'card'
  }`;

/** "H 78° · L 61°" for today, or an empty string when the daily forecast is missing. */
const todayRange = (report: TWeatherReport): string => {
  const today = report.forecast[0];

  if (!today) {
    return '';
  }

  return `H ${today.max}${report.temperatureSymbol} · L ${today.min}${report.temperatureSymbol}`;
};

/**
 * The weather card: a `TWeatherReport` rendered entirely from generic catalog
 * blocks, with no weather-specific component anywhere in the library.
 *
 * The hierarchy is deliberate. Place and condition read first as the heading,
 * the current temperature is the single dominant number, three supporting facts
 * sit under it in a grid, and the day strip is separated by a labelled rule so
 * it reads as a distinct section rather than more stats. Every surface uses the
 * catalog's semantic tones (`default` / `muted` / `accent`), so the card follows
 * the app's forced-dark theme instead of hard-coding colours.
 *
 * Built by typed TypeScript rather than generated token by token: for a voice
 * agent that means the card is on screen the instant the tool resolves, and it
 * is schema-valid by construction.
 *
 * @param report Resolved report from `lib/weather`.
 */
export const createWeatherSpec = (report: TWeatherReport): TJsonRenderSpec => {
  const range = todayRange(report);

  return buildSpec(
    block(
      'CardBlock',
      { title: null, description: null, icon: null, tone: 'default' },
      {
        key: rootKey(report),
        children: [
          block('HeadingBlock', {
            text: report.location.name,
            level: '1',
            subtitle: subtitle(report),
            icon: 'location',
          }),
          block(
            'StackBlock',
            { direction: 'row', gap: 'lg', align: 'center', justify: 'between', wrap: true },
            {
              children: [
                block('MetricBlock', {
                  label: report.current.condition.label,
                  value: String(report.current.temperature),
                  unit: report.temperatureSymbol,
                  delta: null,
                  trend: null,
                  icon: report.current.condition.icon,
                  size: 'lg',
                }),
                ...(range
                  ? [
                      block('BadgeBlock', {
                        text: range,
                        tone: 'secondary',
                        icon: report.current.isDay ? 'sun' : 'moon',
                      }),
                    ]
                  : []),
              ],
            },
          ),
          statsGrid(report),
          ...forecastStrip(report),
          followUpChips(report),
        ],
      },
    ),
  );
};
