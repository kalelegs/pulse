'use client';

import { RealtimeAgent } from '@openai/agents/realtime';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';
import { RunContext } from '@openai/agents';
import {
  AGENT_VOICE,
  HANDOFF_LINES,
  preferenceLines,
  SCREEN_AWARENESS_LINES,
} from '@/agents/shared';
import { stockAnalystTools } from '@/tools';
import { TSessionContext } from '@/types';

/**
 * The stock analyst's instructions for one run.
 *
 * Everything numeric goes through a tool: the model never quotes a price from
 * memory, and when asked whether to buy it reasons out loud from the figures
 * the tool returned rather than from what it believes about the company. The
 * tool summaries (`lib/stocks/summary.ts`) are written to carry exactly the
 * facts that reasoning needs, so the prompt only has to say how to use them.
 *
 * @param runContext Session context, carrying the user's name and preferences.
 */
const buildInstructions = (runContext: RunContext<TSessionContext>): string =>
  [
    RECOMMENDED_PROMPT_PREFIX,
    'You are Pulse, a warm and concise English-speaking voice assistant, currently acting as a stock analyst.',
    `You are speaking with ${runContext.context.userName}, who is in the United States, so`,
    'default to US dollars and US markets unless they say otherwise.',
    ...preferenceLines(runContext.context.preferences),
    '',
    'You are talking out loud, so keep every reply to one or two short sentences.',
    '',
    'You have tools for quotes, price history and news. Always call one before answering',
    'anything numeric — never quote a price, ratio or rating from memory.',
    'The tools return the key figures as sentences; reason from those and only those.',
    'If a figure is unavailable, say so rather than guessing it.',
    '',
    'When asked whether a stock is worth buying, reason briefly out loud from what the tool',
    'returned — valuation (P/E, dividend yield), momentum over the period, where the price',
    'sits in its 52-week range, and the analyst consensus — then give a clear leaning.',
    'Always add, in plain words, that this is not financial advice.',
    '',
    ...SCREEN_AWARENESS_LINES,
    '',
    ...HANDOFF_LINES,
    'When the user moves on from stocks and markets, hand back to the general assistant.',
    '',
    'If you decide to call a tool other than a transfer, announce it in a few words first.',
  ].join('\n');

/**
 * The market-data specialist. Same voice as the root agent — a session cannot
 * change voice after the first agent speaks — and a `handoffDescription` written
 * for the orchestrator's tool list, since that text is all the root agent ever
 * sees of this one.
 */
const stockAnalyst = new RealtimeAgent<TSessionContext>({
  name: 'Stock Analyst',
  voice: AGENT_VOICE,
  handoffDescription:
    'Stock prices, market data, price charts, company fundamentals, analyst ratings, recent financial news, and whether a stock looks like a buy.',
  instructions: buildInstructions,
  tools: stockAnalystTools,
});

export default stockAnalyst;
