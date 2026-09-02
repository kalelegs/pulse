/**
 * How far back a report's price history reaches. The tool vocabulary; providers
 * translate it into their own range tokens.
 */
export type TStockRange = '1w' | '1m' | '3m' | '6m' | '1y';

/** Human label for a range, used in headings and spoken summaries — "past month". */
export const RANGE_LABELS: Record<TStockRange, string> = {
  '1w': 'past week',
  '1m': 'past month',
  '3m': 'past 3 months',
  '6m': 'past 6 months',
  '1y': 'past year',
};

/** The range assumed when the caller does not say. */
export const DEFAULT_RANGE: TStockRange = '1m';

/** One daily close on the history line. */
export type TStockHistoryPoint = {
  /** ISO calendar date, `YYYY-MM-DD`, in the exchange's timezone. */
  date: string;
  close: number;
};

/** Analyst consensus counts for one reporting period. */
export type TStockRecommendation = {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  /** ISO month the counts are for — "2026-08-01". */
  period: string;
};

/** One headline about the company. */
export type TStockNewsItem = {
  headline: string;
  source: string;
  url: string;
  /** ISO timestamp of publication. */
  publishedAt: string;
};

/** Which upstream contributed to a report. Named on the card's disclaimer line. */
export type TStockSource = 'Yahoo Finance' | 'Finnhub';

/**
 * Everything the cards and the spoken summaries need about one listing.
 *
 * Price, change, ranges, volume and history always come from the keyless
 * provider, so they are never null. Fundamentals, analyst ratings and news need
 * a Finnhub key; without one they are `null` / empty and the report is still
 * complete enough to render and speak.
 */
export type TStockReport = {
  /** Ticker as the exchange spells it — "AAPL". */
  symbol: string;
  /** Company name — "Apple Inc.". Falls back to the symbol. */
  name: string;
  /** Exchange display name — "NasdaqGS". */
  exchange: string;
  /** ISO 4217 code the prices are in — "USD". */
  currency: string;
  price: number;
  /** Move since the previous close, in currency units. */
  change: number;
  /** Move since the previous close, in percent. */
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  volume: number;
  /** Market capitalisation in currency units (not millions). Null without Finnhub. */
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  /** Indicated annual dividend yield, in percent. */
  dividendYield: number | null;
  beta: number | null;
  sector: string | null;
  industry: string | null;
  recommendation: TStockRecommendation | null;
  /** Oldest first. Closes the provider left null are dropped. */
  history: TStockHistoryPoint[];
  range: TStockRange;
  /** Newest first, at most a handful, from the last week. Empty without Finnhub. */
  news: TStockNewsItem[];
  /** ISO timestamp of the last trade the quote reflects. */
  asOf: string;
  sources: TStockSource[];
};

/** Why a lookup failed. Callers branch on this instead of parsing message strings. */
export enum EStockErrorCode {
  /** No listing matched the symbol or company name. */
  NOT_FOUND = 'not_found',
  /** The request never completed, or the upstream answered with an error status. */
  NETWORK = 'network',
  /** The upstream answered, but the payload was missing fields we require. */
  MALFORMED = 'malformed',
  /** The upstream did not answer within the request budget. */
  TIMEOUT = 'timeout',
  /** The keyless upstream throttled us. */
  RATE_LIMITED = 'rate_limited',
}

/** Result of one lookup. Discriminated on `ok`; `query` echoes what was asked for. */
export type TStockResult =
  { ok: true; report: TStockReport } | { ok: false; code: EStockErrorCode; query: string };

/** What the caller asks the provider for. */
export type TStockQuery = {
  /** A ticker ("AAPL") or a company name ("Apple") as the user said it. */
  symbol: string;
  range: TStockRange;
};

/**
 * The market-data source, behind an interface.
 *
 * Only `actions/getStockReports.ts` ever calls it — it runs on the server because
 * one upstream needs a secret and the other a custom `User-Agent`.
 */
export type TStockProvider = {
  readonly name: string;
  /** Resolves the query to a report, or to a typed failure. Never throws. */
  getReport: (query: TStockQuery) => Promise<TStockResult>;
};
