'use client';

import { tool } from '@openai/agents';
import { z } from 'zod';
import { createStockNewsSpec } from '@/lib/spec-builders/stockNews';
import { describeNews } from '@/lib/stocks';
import { attachSpecToReply } from '@/tools/attachSpec';
import { loadStockReports } from '@/tools/stockReports';

/**
 * The past week's headlines for one listing as a timeline. Headlines come from
 * Finnhub, so without `FINNHUB_API_KEY` the card explains the gap and the
 * returned sentence tells the model to say news needs an API key.
 */
const getStockNews = tool({
  name: 'get_stock_news',
  description: [
    'Recent news headlines about one listed company, from the last seven days, as a timeline card.',
    'Use it when the user asks what is happening with a company or why a stock moved.',
    'This tool renders the timeline into the conversation on its own — do not read the list out.',
    'It returns up to three headlines; mention them briefly in your own words. If it says news needs an API key, tell the user that plainly.',
  ].join(' '),
  parameters: z.object({
    symbol: z.string().describe('A ticker ("AAPL") or a company name ("Apple").'),
  }),
  async execute({ symbol }) {
    const { reports, failureNotes, finnhubConfigured } = await loadStockReports([symbol], null);
    const [report] = reports;

    if (!report) {
      return failureNotes.join(' ');
    }

    attachSpecToReply(createStockNewsSpec(report, finnhubConfigured));

    return describeNews(report, finnhubConfigured);
  },
});

export default getStockNews;
