import {
  consensusPhrase,
  directionOf,
  periodChangePercent,
  rangePosition,
} from '@/lib/stocks/derive';
import { formatCompact, formatMoney, formatPercent } from '@/lib/stocks/format';
import { EStockErrorCode, RANGE_LABELS, type TStockReport } from '@/lib/stocks/types';

const SCREEN_NOTE =
  'The card is already on screen. Say one or two sentences about it and never read it out field by field.';

/** "up 1.3%", "down 0.4%" or "flat". */
const movePhrase = (percent: number): string => {
  const direction = directionOf(percent);

  return direction === 'flat' ? 'flat' : `${direction} ${formatPercent(Math.abs(percent))}`;
};

/** "83% of the way up its 52-week range of $225.95 to $344.57". */
const rangePhrase = (report: TStockReport): string => {
  const position = rangePosition(report);
  const bounds = `${formatMoney(report.week52Low, report.currency)} to ${formatMoney(report.week52High, report.currency)}`;

  return position === null
    ? `its 52-week range is ${bounds}`
    : `${position}% of the way up its 52-week range of ${bounds}`;
};

/** P/E and dividend yield when known; says which are unavailable rather than inventing them. */
const valuationSentence = (report: TStockReport): string => {
  const known = [
    report.peRatio !== null ? `the P/E ratio is ${report.peRatio.toFixed(1)}` : null,
    report.dividendYield !== null
      ? `the dividend yield is ${formatPercent(report.dividendYield, false, 2)}`
      : null,
  ].filter((part): part is string => part !== null);

  if (known.length === 2) {
    return `${known[0]} and ${known[1]}.`;
  }

  if (known.length === 1) {
    return `${known[0]}; ${report.peRatio === null ? 'P/E' : 'dividend yield'} is unavailable.`;
  }

  return 'P/E and dividend yield are unavailable for this listing.';
};

/** "Over the past month the shares are up 4.1%." or an honest "no history" line. */
const trendSentence = (report: TStockReport): string => {
  const change = periodChangePercent(report);

  return change === null
    ? `No price history came back for the ${RANGE_LABELS[report.range]}.`
    : `Over the ${RANGE_LABELS[report.range]} the shares are ${movePhrase(change)}.`;
};

const capitalise = (sentence: string): string =>
  sentence.charAt(0).toUpperCase() + sentence.slice(1);

/**
 * The facts the model reasons from and speaks about for one listing.
 *
 * Three or four plain sentences: price and today's move, position in the
 * 52-week range, valuation, analyst consensus and the period trend. Every
 * figure is either stated or declared unavailable, never guessed — the model
 * is told to give a view, so it must not be left to fill gaps itself.
 */
export const describeReport = (report: TStockReport): string =>
  [
    `${report.name} (${report.symbol}) is trading at ${formatMoney(report.price, report.currency)}, ${movePhrase(report.changePercent)} today.`,
    `That is ${rangePhrase(report)}.`,
    capitalise(valuationSentence(report)),
    `${capitalise(consensusPhrase(report.recommendation) ?? 'analyst ratings are unavailable')}.`,
    trendSentence(report),
    SCREEN_NOTE,
  ].join(' ');

/** One dense line per listing, so the model can hold several side by side. */
const compareLine = (report: TStockReport): string => {
  const position = rangePosition(report);
  const trend = periodChangePercent(report);

  return [
    `${report.symbol}: ${formatMoney(report.price, report.currency)}`,
    `${movePhrase(report.changePercent)} today`,
    position === null ? '52-week position unavailable' : `${position}% up its 52-week range`,
    `P/E ${report.peRatio === null ? 'unavailable' : report.peRatio.toFixed(1)}`,
    `market cap ${report.marketCap === null ? 'unavailable' : formatCompact(report.marketCap, report.currency)}`,
    consensusPhrase(report.recommendation) ?? 'no analyst ratings',
    trend === null
      ? `no ${RANGE_LABELS[report.range]} history`
      : `${movePhrase(trend)} over the ${RANGE_LABELS[report.range]}`,
  ].join(', ');
};

/**
 * The same facts for several listings, ending with the instruction that turns
 * the model from a reader into an analyst.
 */
export const compareReports = (reports: TStockReport[]): string =>
  [
    `Comparing ${reports.length} listings.`,
    ...reports.map((report) => `${compareLine(report)}.`),
    SCREEN_NOTE,
    'Give a reasoned view that weighs these figures, and say plainly that this is not financial advice.',
  ].join(' ');

/**
 * What the assistant should say when a lookup fails. Every branch is a sentence
 * a person can act on.
 *
 * @param code Why the lookup failed.
 * @param query The ticker or company name the user asked about.
 */
export const summariseFailure = (code: EStockErrorCode, query: string): string => {
  switch (code) {
    case EStockErrorCode.NOT_FOUND:
      return `Tell the user you could not find a listing called "${query}" and ask for the ticker symbol or the full company name.`;
    case EStockErrorCode.TIMEOUT:
      return `Tell the user the market data service is slow to respond right now and offer to try "${query}" again.`;
    case EStockErrorCode.RATE_LIMITED:
      return `Tell the user the market data service is rate limiting requests and offer to try "${query}" again in a minute.`;
    case EStockErrorCode.NETWORK:
      return `Tell the user you could not reach the market data service and offer to try "${query}" again in a moment.`;
    case EStockErrorCode.MALFORMED:
    default:
      return `Tell the user the market data service returned incomplete data for "${query}" and offer to try again.`;
  }
};
