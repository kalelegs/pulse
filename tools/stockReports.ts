'use client';

import { getStockReports } from '@/actions/getStockReports';
import { summariseFailure, type TStockRange, type TStockReport } from '@/lib/stocks';

/** The server action's results, split into what rendered and what did not. */
export type TLoadedReports = {
  reports: TStockReport[];
  /** One spoken apology per symbol that failed, ready to append to the reply. */
  failureNotes: string[];
  finnhubConfigured: boolean;
};

/**
 * Calls the stock server action and sorts its per-symbol results.
 *
 * Shared by the three stock tools so each is only the wiring between data,
 * builder and summary — the same shape as `tools/weather.ts`. A rejected action
 * (the server is down, the network dropped) is turned into one network apology
 * rather than thrown, because a thrown tool leaves the model with nothing to say.
 *
 * @param symbols Tickers or company names, as the model passed them.
 * @param range History range; null for the default.
 */
export const loadStockReports = async (
  symbols: string[],
  range: TStockRange | null,
): Promise<TLoadedReports> => {
  try {
    const { results, finnhubConfigured } = await getStockReports({ symbols, range });

    return {
      reports: results.flatMap((result) => (result.ok ? [result.report] : [])),
      failureNotes: results.flatMap((result) =>
        result.ok ? [] : [summariseFailure(result.code, result.query)],
      ),
      finnhubConfigured,
    };
  } catch (error) {
    console.error('[stocks] the report action failed', error);

    return {
      reports: [],
      failureNotes: [
        `Tell the user you could not reach the market data service for "${symbols.join(', ')}" and offer to try again in a moment.`,
      ],
      finnhubConfigured: false,
    };
  }
};
