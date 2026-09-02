'use server';

import { isFinnhubConfigured } from '@/lib/stocks/finnhub';
import { stockProvider } from '@/lib/stocks/provider';
import {
  DEFAULT_RANGE,
  EStockErrorCode,
  type TStockRange,
  type TStockResult,
} from '@/lib/stocks/types';

/** How many listings one call may ask for. Bounds the fan-out of a public endpoint. */
const MAX_SYMBOLS = 4;

const RANGES: TStockRange[] = ['1w', '1m', '3m', '6m', '1y'];

/** What the client tools send. `range` may be omitted or null for the default. */
export type TStockReportsInput = {
  /** Tickers or company names, one to four. */
  symbols: string[];
  range?: TStockRange | null;
};

/** One result per requested symbol, in request order, plus whether the keyed provider is on. */
export type TStockReportsOutput = {
  results: TStockResult[];
  /** False when `FINNHUB_API_KEY` is unset — fundamentals, ratings and news will all be empty. */
  finnhubConfigured: boolean;
};

const isRange = (value: unknown): value is TStockRange =>
  typeof value === 'string' && (RANGES as string[]).includes(value);

/**
 * Server action that fetches stock reports for the browser-side tools.
 *
 * It exists because neither upstream can be called from the browser: Yahoo
 * wants a browser-like `User-Agent` a page cannot set, and Finnhub wants a key
 * that must never reach the client. Like `getEphemeralToken`, the action is
 * unauthenticated — anyone who can load the page can call it — so it validates
 * its input rather than trusting the caller, caps the fan-out, and never throws
 * for a bad symbol: each entry comes back as a typed `TStockResult`.
 *
 * @param input Symbols to look up and the history range to include.
 */
export const getStockReports = async (input: TStockReportsInput): Promise<TStockReportsOutput> => {
  const symbols = (Array.isArray(input?.symbols) ? input.symbols : [])
    .filter((symbol): symbol is string => typeof symbol === 'string' && symbol.trim().length > 0)
    .slice(0, MAX_SYMBOLS);
  const range = isRange(input?.range) ? input.range : DEFAULT_RANGE;
  const finnhubConfigured = isFinnhubConfigured();

  if (!symbols.length) {
    return {
      results: [{ ok: false, code: EStockErrorCode.NOT_FOUND, query: '' }],
      finnhubConfigured,
    };
  }

  const results = await Promise.all(
    symbols.map((symbol) => stockProvider.getReport({ symbol, range })),
  );

  return { results, finnhubConfigured };
};
