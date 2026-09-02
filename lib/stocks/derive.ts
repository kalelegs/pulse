import type { TStockRecommendation, TStockReport } from '@/lib/stocks/types';

/** The direction a signed change points, for trends, tones and verbs. */
export type TDirection = 'up' | 'down' | 'flat';

/**
 * Moves smaller than this read as "flat". Percentages are spoken to one decimal,
 * so anything that would round to "0.0%" must not be called up or down.
 */
const FLAT_THRESHOLD_PERCENT = 0.05;

export const directionOf = (percent: number): TDirection => {
  if (Math.abs(percent) < FLAT_THRESHOLD_PERCENT) {
    return 'flat';
  }

  return percent > 0 ? 'up' : 'down';
};

/**
 * Where the price sits in its 52-week range, 0-100. Null when the range has no
 * width (a listing a day old) — a division by zero is not a position.
 */
export const rangePosition = (report: TStockReport): number | null => {
  const width = report.week52High - report.week52Low;

  if (width <= 0) {
    return null;
  }

  const position = ((report.price - report.week52Low) / width) * 100;

  return Math.round(Math.min(100, Math.max(0, position)));
};

/** First and last close of the history, or null when there are too few points to compare. */
export const periodEndpoints = (report: TStockReport): { first: number; last: number } | null => {
  const first = report.history[0]?.close;
  const last = report.history[report.history.length - 1]?.close;

  return typeof first === 'number' &&
    typeof last === 'number' &&
    first > 0 &&
    report.history.length > 1
    ? { first, last }
    : null;
};

/** Percent change from the first close of the range to the last. Null with too little history. */
export const periodChangePercent = (report: TStockReport): number | null => {
  const endpoints = periodEndpoints(report);

  return endpoints ? ((endpoints.last - endpoints.first) / endpoints.first) * 100 : null;
};

/** The dated high and low closes of the history. Null when there is no history at all. */
export const periodExtremes = (
  report: TStockReport,
): { high: TStockReport['history'][number]; low: TStockReport['history'][number] } | null => {
  const [first] = report.history;

  if (!first) {
    return null;
  }

  return report.history.reduce(
    (extremes, point) => ({
      high: point.close > extremes.high.close ? point : extremes.high,
      low: point.close < extremes.low.close ? point : extremes.low,
    }),
    { high: first, low: first },
  );
};

/** Analyst counts collapsed to the three words a person uses. */
export const consensusCounts = (
  recommendation: TStockRecommendation,
): { buy: number; hold: number; sell: number; total: number } => {
  const buy = recommendation.strongBuy + recommendation.buy;
  const sell = recommendation.sell + recommendation.strongSell;
  const { hold } = recommendation;

  return { buy, hold, sell, total: buy + hold + sell };
};

/** "28 of 35 analysts rate it buy, 6 hold and 1 sell", or null when there are no ratings. */
export const consensusPhrase = (recommendation: TStockRecommendation | null): string | null => {
  if (!recommendation) {
    return null;
  }

  const { buy, hold, sell, total } = consensusCounts(recommendation);

  if (total === 0) {
    return null;
  }

  return `${buy} of ${total} analysts rate it buy, ${hold} hold and ${sell} sell`;
};
