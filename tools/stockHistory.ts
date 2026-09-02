'use client';

import { tool } from '@openai/agents';
import { z } from 'zod';
import { createStockHistorySpec } from '@/lib/spec-builders/stockHistory';
import { describeHistory } from '@/lib/stocks';
import { attachSpecToReply } from '@/tools/attachSpec';
import { loadStockReports } from '@/tools/stockReports';

/**
 * A chart-led card of one listing's daily closes over a range, with the period
 * change and its dated high and low. Same wiring as `get_stock_quote`.
 */
const getStockHistory = tool({
  name: 'get_stock_history',
  description: [
    'Daily price history for one listing over a range, as a large chart with the period change, high and low.',
    'Use it when the user asks how a stock has done over a period, wants a chart, or asks about momentum.',
    'This tool renders the chart card into the conversation on its own — do not describe it and do not read the points out.',
    'Speak one or two sentences about the trend from the summary this tool returns.',
  ].join(' '),
  parameters: z.object({
    symbol: z.string().describe('A ticker ("AAPL") or a company name ("Apple").'),
    range: z
      .enum(['1w', '1m', '3m', '6m', '1y'])
      .describe('The period to chart: one week, one month, three months, six months or one year.'),
  }),
  async execute({ symbol, range }) {
    const { reports, failureNotes } = await loadStockReports([symbol], range);
    const [report] = reports;

    if (!report) {
      return failureNotes.join(' ');
    }

    attachSpecToReply(createStockHistorySpec(report));

    return describeHistory(report);
  },
});

export default getStockHistory;
