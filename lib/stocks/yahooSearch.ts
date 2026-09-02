import { fetchJson } from '@/lib/stocks/fetchJson';
import { EStockErrorCode } from '@/lib/stocks/types';
import { YAHOO_HEADERS } from '@/lib/stocks/yahoo';

const SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';

/** Listing types a "stock" question can be about. Indices, futures and currencies are dropped. */
const TRADABLE_TYPES = new Set(['EQUITY', 'ETF']);

type TSearchQuote = {
  symbol?: string;
  longname?: string;
  shortname?: string;
  quoteType?: string;
  exchDisp?: string;
  sectorDisp?: string;
  industryDisp?: string;
};

type TSearchPayload = { quotes?: TSearchQuote[] };

/** A listing resolved from a company name. */
export type TStockListing = {
  symbol: string;
  name: string | null;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
};

export type TStockListingResult =
  { ok: true; listing: TStockListing } | { ok: false; code: EStockErrorCode };

/**
 * Whether the input already reads as a ticker: short, upper-case, with the
 * punctuation exchanges use ("BRK.B", "BF-B"). Anything with spaces or lower-case
 * letters is a company name and goes straight to search.
 */
export const looksLikeTicker = (input: string): boolean => /^[A-Z][A-Z0-9.\-^=]{0,9}$/.test(input);

/**
 * Resolves a company name ("apple", "Amazon") to a ticker via Yahoo's search
 * endpoint, taking the top equity or ETF result — Yahoo already ranks the
 * primary listing first.
 *
 * @param query Free-text company name, as the user said it.
 */
export const searchListing = async (query: string): Promise<TStockListingResult> => {
  const params = new URLSearchParams({ q: query, quotesCount: '5', newsCount: '0' });
  const response = await fetchJson<TSearchPayload>(`${SEARCH_URL}?${params}`, YAHOO_HEADERS);

  if (!response.ok) {
    return response;
  }

  const match = (response.data.quotes ?? []).find(
    (quote) => quote.symbol && TRADABLE_TYPES.has(quote.quoteType ?? ''),
  );

  if (!match?.symbol) {
    return { ok: false, code: EStockErrorCode.NOT_FOUND };
  }

  return {
    ok: true,
    listing: {
      symbol: match.symbol,
      name: match.longname ?? match.shortname ?? null,
      exchange: match.exchDisp ?? null,
      sector: match.sectorDisp ?? null,
      industry: match.industryDisp ?? null,
    },
  };
};
