import { fetchFinnhubExtras, type TFinnhubExtras } from '@/lib/stocks/finnhub';
import {
  EStockErrorCode,
  type TStockProvider,
  type TStockQuery,
  type TStockReport,
  type TStockResult,
  type TStockSource,
} from '@/lib/stocks/types';
import { fetchYahooQuote, type TYahooQuote, type TYahooQuoteResult } from '@/lib/stocks/yahoo';
import { looksLikeTicker, searchListing, type TStockListing } from '@/lib/stocks/yahooSearch';

/** Both halves of a lookup for one resolved ticker. */
type TFetched = { quote: TYahooQuoteResult; extras: TFinnhubExtras };

/**
 * Fetches the keyless and keyed halves together. Finnhub never fails — it
 * settles every call on its own and returns empty extras — so `Promise.all`
 * here can only reject if Yahoo throws, which `fetchJson` guarantees it never does.
 */
const fetchBoth = async (symbol: string, range: TStockQuery['range']): Promise<TFetched> => {
  const [quote, extras] = await Promise.all([
    fetchYahooQuote(symbol, range),
    fetchFinnhubExtras(symbol),
  ]);

  return { quote, extras };
};

const toReport = (
  quote: TYahooQuote,
  extras: TFinnhubExtras,
  listing: TStockListing | null,
  range: TStockQuery['range'],
): TStockReport => {
  const change = quote.price - quote.previousClose;
  const sources: TStockSource[] = extras.contributed
    ? ['Yahoo Finance', 'Finnhub']
    : ['Yahoo Finance'];

  return {
    symbol: quote.symbol,
    name: quote.name,
    exchange: quote.exchange || (listing?.exchange ?? ''),
    currency: quote.currency,
    price: quote.price,
    change,
    changePercent: quote.previousClose > 0 ? (change / quote.previousClose) * 100 : 0,
    previousClose: quote.previousClose,
    dayHigh: quote.dayHigh,
    dayLow: quote.dayLow,
    week52High: quote.week52High,
    week52Low: quote.week52Low,
    volume: quote.volume,
    marketCap: extras.marketCap,
    peRatio: extras.peRatio,
    eps: extras.eps,
    dividendYield: extras.dividendYield,
    beta: extras.beta,
    sector: listing?.sector ?? null,
    industry: extras.industry ?? listing?.industry ?? null,
    recommendation: extras.recommendation,
    history: quote.history,
    range,
    news: extras.news,
    asOf: quote.asOf,
    sources,
  };
};

/**
 * The composed market-data provider: Yahoo Finance for everything keyless,
 * Finnhub for what needs a key.
 *
 * Resolution order for `query.symbol`:
 *
 * 1. Input that reads as a ticker ("AAPL", "BRK.B") goes straight to the chart.
 * 2. Input that reads as a name ("apple", "Amazon.com") is searched first.
 * 3. A ticker the chart does not know (404) is searched as a name once — the
 *    user may have said "apple" and the model upper-cased it.
 *
 * Finnhub is fetched alongside the chart and can never fail the report: with
 * no key, or with every keyed call failing, the fundamentals are `null`, the
 * news is empty and `sources` names Yahoo alone.
 */
export const stockProvider: TStockProvider = {
  name: 'yahoo+finnhub',

  getReport: async (query: TStockQuery): Promise<TStockResult> => {
    const input = query.symbol.trim();

    if (!input) {
      return { ok: false, code: EStockErrorCode.NOT_FOUND, query: input };
    }

    let listing: TStockListing | null = null;
    let symbol = input.toUpperCase();

    if (!looksLikeTicker(symbol)) {
      const found = await searchListing(input);

      if (!found.ok) {
        return { ok: false, code: found.code, query: input };
      }

      listing = found.listing;
      symbol = listing.symbol;
    }

    let fetched = await fetchBoth(symbol, query.range);

    if (!fetched.quote.ok && fetched.quote.code === EStockErrorCode.NOT_FOUND && !listing) {
      const found = await searchListing(input);

      if (found.ok) {
        listing = found.listing;
        fetched = await fetchBoth(listing.symbol, query.range);
      }
    }

    if (!fetched.quote.ok) {
      return { ok: false, code: fetched.quote.code, query: input };
    }

    return {
      ok: true,
      report: toReport(fetched.quote.quote, fetched.extras, listing, query.range),
    };
  },
};
