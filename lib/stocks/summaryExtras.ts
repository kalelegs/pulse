import { directionOf, periodEndpoints, periodExtremes } from '@/lib/stocks/derive';
import { formatDateLabel, formatMoney, formatPercent, relativeTime } from '@/lib/stocks/format';
import { RANGE_LABELS, type TStockReport } from '@/lib/stocks/types';

/** How many headlines the model is told to mention. The card shows them all. */
const SPOKEN_HEADLINES = 3;

/**
 * The sentences behind the history card: where the price went over the range,
 * and when it peaked and bottomed.
 */
export const describeHistory = (report: TStockReport): string => {
  const endpoints = periodEndpoints(report);
  const extremes = periodExtremes(report);
  const period = RANGE_LABELS[report.range];

  if (!endpoints || !extremes) {
    return `No daily price history came back for ${report.symbol} over the ${period}. The current price is ${formatMoney(report.price, report.currency)}. Tell the user the chart is unavailable for that range.`;
  }

  const change = ((endpoints.last - endpoints.first) / endpoints.first) * 100;
  const direction = directionOf(change);
  const move =
    direction === 'flat' ? 'essentially flat' : `${direction} ${formatPercent(Math.abs(change))}`;

  return [
    `Over the ${period} ${report.name} (${report.symbol}) went from ${formatMoney(endpoints.first, report.currency)} to ${formatMoney(endpoints.last, report.currency)}, ${move}.`,
    `It peaked at ${formatMoney(extremes.high.close, report.currency)} on ${formatDateLabel(extremes.high.date)} and bottomed at ${formatMoney(extremes.low.close, report.currency)} on ${formatDateLabel(extremes.low.date)}.`,
    'The chart is already on screen. Say one or two sentences about the trend and never list the points.',
  ].join(' ');
};

/**
 * The sentences behind the news card: up to three headlines for the model to
 * mention, or the reason there are none. The key hint is explicit so the model
 * can tell the user *why* news is missing instead of apologising vaguely.
 *
 * @param report The report the headlines belong to.
 * @param finnhubConfigured Whether the server had a Finnhub key to ask with.
 */
export const describeNews = (report: TStockReport, finnhubConfigured: boolean): string => {
  if (!finnhubConfigured) {
    return `Headlines for ${report.name} are unavailable because news needs a Finnhub API key and FINNHUB_API_KEY is not configured. Tell the user news is off until an API key is added, and offer the quote or the price chart instead.`;
  }

  if (!report.news.length) {
    return `No headlines about ${report.name} (${report.symbol}) were published in the last week. Tell the user it has been a quiet week for news and offer the quote or the chart instead.`;
  }

  const now = new Date();
  const spoken = report.news
    .slice(0, SPOKEN_HEADLINES)
    .map(
      (item, index) =>
        `${index + 1}) ${item.headline} (${item.source}, ${relativeTime(item.publishedAt, now)})`,
    );

  return [
    `Recent headlines for ${report.name} (${report.symbol}): ${spoken.join('; ')}.`,
    `The full timeline is already on screen. Mention at most ${SPOKEN_HEADLINES} headlines in your own words, briefly, and do not read the list out.`,
  ].join(' ');
};
