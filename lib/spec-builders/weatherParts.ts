import { bind, block, type TSpecNode } from '@/lib/spec-builders/builder';
import type { TForecastDay, TWeatherReport } from '@/lib/weather/types';

/** Reads the "feels like" delta as an icon, so the card says warmer/colder without words. */
const feelsLikeIcon = (report: TWeatherReport) => {
  const { temperature, apparentTemperature } = report.current;

  if (apparentTemperature > temperature) {
    return 'hot' as const;
  }

  return apparentTemperature < temperature ? ('cold' as const) : ('check' as const);
};

/**
 * The three supporting facts under the headline temperature.
 *
 * Composed from `MetricBlock`, not `KeyValueBlock`. A KeyValue row is internally
 * `justify-between`, so three of them side by side put *more* space inside each
 * label/value pair than between neighbouring pairs — the row reads as one
 * run-on sentence ("Feels like 88°F Humidity 38% Wind 9 mph") instead of three
 * facts. Stacking value over label at `md` makes each cell a self-contained
 * unit, and the shared structure (icon, number, one-line caption) keeps the
 * three on a common baseline.
 *
 * The compass point rides on the *label* rather than the value for the same
 * reason: "9 mph WNW" is long enough to wrap in a narrow card, and a wrapped
 * cell is twice the height of its neighbours.
 */
export const statsGrid = (report: TWeatherReport): TSpecNode => {
  const { current, temperatureSymbol: symbol, windUnit } = report;

  return block(
    'GridBlock',
    { columns: 3, gap: 'sm' },
    {
      children: [
        block('MetricBlock', {
          label: 'Feels like',
          value: String(current.apparentTemperature),
          unit: symbol,
          delta: null,
          trend: null,
          icon: feelsLikeIcon(report),
          size: 'md',
        }),
        block('MetricBlock', {
          label: 'Humidity',
          value: String(current.humidity),
          unit: '%',
          delta: null,
          trend: null,
          icon: 'humidity',
          size: 'md',
        }),
        block('MetricBlock', {
          label: `Wind ${current.windCompass}`,
          value: String(current.windSpeed),
          unit: windUnit,
          delta: null,
          trend: null,
          icon: 'wind',
          size: 'md',
        }),
      ],
    },
  );
};

/** One day of the horizontal forecast strip: weekday, condition icon, high over low. */
const forecastCell = (day: TForecastDay, symbol: string, isToday: boolean): TSpecNode =>
  block(
    'CardBlock',
    { title: null, description: null, icon: null, tone: isToday ? 'accent' : 'muted' },
    {
      children: [
        block(
          'StackBlock',
          { direction: 'column', gap: 'sm', align: 'center', justify: null, wrap: null },
          {
            children: [
              block('LabelBlock', { text: isToday ? 'Today' : day.weekday, subtle: !isToday }),
              block('IconBlock', {
                name: day.condition.icon,
                size: 'md',
                tone: 'primary',
                label: day.condition.label,
              }),
              block('TextBlock', {
                text: `${day.max}${symbol}`,
                tone: 'default',
                size: 'md',
                align: 'center',
              }),
              block('TextBlock', {
                text: `${day.min}${symbol}`,
                tone: 'muted',
                size: 'sm',
                align: 'center',
              }),
            ],
          },
        ),
      ],
    },
  );

/** How many day cells fit across the card before scrolling has to take over. */
const MAX_DAYS_IN_A_ROW = 5;

/**
 * The day strip. Returns nothing when the provider gave us no daily data.
 *
 * A short forecast is laid out as a grid rather than a carousel: every day is
 * visible at once, with no half-clipped final cell implying content the reader
 * cannot reach. Longer forecasts fall back to `CarouselBlock`, which carries its
 * own edge affordance so the overflow reads as scrollable rather than broken.
 */
export const forecastStrip = (report: TWeatherReport): TSpecNode[] => {
  if (!report.forecast.length) {
    return [];
  }

  const days = report.forecast.map((day, index) =>
    forecastCell(day, report.temperatureSymbol, index === 0),
  );

  return [
    block('DividerBlock', {
      label: `Next ${report.forecast.length} days`,
      orientation: 'horizontal',
    }),
    days.length <= MAX_DAYS_IN_A_ROW
      ? block('GridBlock', { columns: days.length, gap: 'sm' }, { children: days })
      : block('CarouselBlock', { title: null, itemWidth: 'sm' }, { children: days }),
  ];
};

/** Two follow-ups the user can tap instead of speaking, bound to the `suggest` action. */
export const followUpChips = (report: TWeatherReport): TSpecNode => {
  const place = report.location.name;

  return block(
    'StackBlock',
    { direction: 'row', gap: 'sm', align: 'center', justify: null, wrap: true },
    {
      children: [
        block(
          'SuggestionChip',
          { text: 'Show me tomorrow', hint: null, tone: 'outline', icon: 'calendar' },
          {
            on: {
              press: bind('suggest', {
                text: `What is the weather in ${place} tomorrow?`,
                value: null,
              }),
            },
          },
        ),
        block(
          'SuggestionChip',
          { text: 'What should I wear?', hint: null, tone: 'outline', icon: 'idea' },
          {
            on: {
              press: bind('suggest', {
                text: `What should I wear in ${place} today?`,
                value: null,
              }),
            },
          },
        ),
      ],
    },
  );
};
