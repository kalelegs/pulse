'use client';

import { tool } from '@openai/agents';
import { z } from 'zod';
import { createStockComparisonSpec } from '@/lib/spec-builders/stockComparison';
import { createStockQuoteSpec } from '@/lib/spec-builders/stockQuote';
import { compareReports, describeReport } from '@/lib/stocks';
import { attachSpecToReply } from '@/tools/attachSpec';
import { loadStockReports } from '@/tools/stockReports';

/**
 * A quote card for one listing, or a comparison card for several.
 *
 * The data comes from `actions/getStockReports` (server-side, because the
 * upstreams need headers a browser cannot send); the card is built by the typed
 * builders and attached here; what the model receives back are the sentences
 * it reasons and speaks from — see `lib/stocks/summary.ts`.
 */
const getStockQuote = tool({
  name: 'get_stock_quote',
  description: [
    "Current price, today's move, 52-week range, volume, and — when available — market cap, P/E, EPS, dividend yield, beta and analyst ratings for one or more listings.",
    'Pass one symbol for a quote card, or two to four to get a side-by-side comparison card.',
    'This tool renders the card into the conversation on its own — do not describe it and do not read it out field by field.',
    'It returns the key figures as sentences: reason from those, speak one or two sentences, and when asked whether to buy give a clear leaning while saying it is not financial advice.',
  ].join(' '),
  parameters: z.object({
    symbols: z
      .array(z.string())
      .describe(
        'One to four tickers ("AAPL") or company names ("Apple"). Names are resolved to tickers automatically.',
      ),
    range: z
      .enum(['1w', '1m', '3m', '6m', '1y'])
      .nullable()
      .describe(
        'How much price history the sparkline covers. Pass null for the one-month default.',
      ),
  }),
  async execute({ symbols, range }) {
    const { reports, failureNotes } = await loadStockReports(symbols, range);

    if (!reports.length) {
      return failureNotes.join(' ');
    }

    attachSpecToReply(
      reports.length === 1 ? createStockQuoteSpec(reports[0]) : createStockComparisonSpec(reports),
    );

    const summary = reports.length === 1 ? describeReport(reports[0]) : compareReports(reports);

    return [summary, ...failureNotes].join(' ');
  },
});

export default getStockQuote;
