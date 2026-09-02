import { fetchJson, type TFetchJsonResult } from '@/lib/stocks/fetchJson';
import { toIsoDate } from '@/lib/stocks/format';
import { EStockErrorCode, type TStockHistoryPoint, type TStockRange } from '@/lib/stocks/types';

const CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

/**
 * Yahoo answers a bare `fetch` (no `User-Agent`) with an HTML error page, and
 * throttles the full Chrome UA string. A minimal browser-like value is what it
 * accepts reliably, and it is why these calls run server-side.
 */
export const YAHOO_HEADERS = { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' };

/** Our range vocabulary in Yahoo's tokens. */
const YAHOO_RANGES: Record<TStockRange, string> = {
  '1w': '5d',
  '1m': '1mo',
  '3m': '3mo',
  '6m': '6mo',
  '1y': '1y',
};

type TChartMeta = {
  symbol?: string;
  currency?: string;
  fullExchangeName?: string;
  exchangeName?: string;
  exchangeTimezoneName?: string;
  longName?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  chartPreviousClose?: number;
};

type TChartPayload = {
  chart?: {
    result?: {
      meta?: TChartMeta;
      timestamp?: number[];
      indicators?: { quote?: { close?: (number | null)[] }[] };
    }[];
    error?: { code?: string; description?: string } | null;
  };
};

/** The keyless half of a report: everything the chart endpoint knows. */
export type TYahooQuote = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  volume: number;
  history: TStockHistoryPoint[];
  asOf: string;
};

export type TYahooQuoteResult =
  { ok: true; quote: TYahooQuote } | { ok: false; code: EStockErrorCode };

/** Zips the column-oriented arrays into dated points, dropping the closes Yahoo left null. */
const toHistory = (
  timestamps: number[],
  closes: (number | null)[],
  timeZone: string,
): TStockHistoryPoint[] =>
  timestamps.flatMap((timestamp, index) => {
    const close = closes[index];

    return typeof close === 'number' && Number.isFinite(close)
      ? [{ date: toIsoDate(timestamp, timeZone), close: Number(close.toFixed(4)) }]
      : [];
  });

/**
 * The close before today's bar.
 *
 * `chartPreviousClose` is the close before the *range* starts, not yesterday's,
 * so "today's move" is read off the history instead: when the last bar is the
 * session the quote is from, the bar before it is the previous close; when the
 * market has not opened yet, the last bar is.
 */
const previousCloseFrom = (
  history: TStockHistoryPoint[],
  meta: TChartMeta,
  timeZone: string,
): number | undefined => {
  const last = history[history.length - 1];
  const tradeDate = meta.regularMarketTime ? toIsoDate(meta.regularMarketTime, timeZone) : null;
  const previous = last && last.date === tradeDate ? history[history.length - 2] : last;

  return previous?.close ?? meta.chartPreviousClose;
};

const chartUrl = (symbol: string, range: TStockRange): string =>
  `${CHART_URL}/${encodeURIComponent(symbol)}?range=${YAHOO_RANGES[range]}&interval=1d`;

/**
 * Fetches price, ranges and daily closes for one ticker from Yahoo's chart
 * endpoint. A 404 means the symbol does not exist — the caller falls back to a
 * name search — and every other failure surfaces as its own code.
 *
 * @param symbol Exchange ticker, already upper-cased.
 * @param range How much daily history to include.
 */
export const fetchYahooQuote = async (
  symbol: string,
  range: TStockRange,
): Promise<TYahooQuoteResult> => {
  const response: TFetchJsonResult<TChartPayload> = await fetchJson(
    chartUrl(symbol, range),
    YAHOO_HEADERS,
  );

  if (!response.ok) {
    return response;
  }

  const result = response.data.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta || typeof meta.regularMarketPrice !== 'number') {
    return { ok: false, code: EStockErrorCode.NOT_FOUND };
  }

  const timeZone = meta.exchangeTimezoneName ?? 'America/New_York';
  const history = toHistory(
    result.timestamp ?? [],
    result.indicators?.quote?.[0]?.close ?? [],
    timeZone,
  );
  const previousClose = previousCloseFrom(history, meta, timeZone);

  if (typeof previousClose !== 'number') {
    return { ok: false, code: EStockErrorCode.MALFORMED };
  }

  return {
    ok: true,
    quote: {
      symbol: meta.symbol ?? symbol,
      name: meta.longName ?? meta.shortName ?? symbol,
      exchange: meta.fullExchangeName ?? meta.exchangeName ?? '',
      currency: meta.currency ?? 'USD',
      price: meta.regularMarketPrice,
      previousClose,
      dayHigh: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      dayLow: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      week52High: meta.fiftyTwoWeekHigh ?? meta.regularMarketPrice,
      week52Low: meta.fiftyTwoWeekLow ?? meta.regularMarketPrice,
      volume: meta.regularMarketVolume ?? 0,
      history,
      asOf: new Date((meta.regularMarketTime ?? Date.now() / 1000) * 1000).toISOString(),
    },
  };
};
