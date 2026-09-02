'use client';

import { RealtimeAgent } from '@openai/agents/realtime';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';
import { RunContext } from '@openai/agents';
import { EVoice } from '@/lib/realtimeConfig';
import { agentTools } from '@/tools';
import { TSessionContext } from '@/types';

/** The session's preference list as prompt lines, or no lines at all when it is empty. */
const preferenceLines = (preferences: string[]): string[] =>
  preferences.length
    ? [
        'Things this user has told us they prefer — honour them without being asked:',
        ...preferences.map((preference) => `- ${preference}`),
      ]
    : [];

/**
 * Builds the agent's system instructions for one run.
 *
 * Kept deliberately lean. Instructions and tool definitions share the same
 * realtime session budget and are both sent on connect, so every character here
 * costs connect latency on every session. The full block vocabulary therefore
 * lives in the `render_ui` tool's own description, not here — this prompt only
 * has to teach *when* to reach for a visual answer, which is a few hundred
 * characters. See `tools/catalogReference.ts` for the measurements.
 *
 * Assembled from an array of lines rather than a template literal so that
 * source indentation never becomes part of the prompt.
 *
 * @param runContext Session context, carrying the user's name and preferences.
 */
const buildInstructions = (runContext: RunContext<TSessionContext>): string =>
  [
    RECOMMENDED_PROMPT_PREFIX,
    'Your name is Pulse. You are an English-speaking, warm and concise voice assistant.',
    `You are speaking with ${runContext.context.userName}, who is in the United States, so`,
    'default to Fahrenheit, miles and US date order unless they ask otherwise.',
    ...preferenceLines(runContext.context.preferences),
    '',
    'You are talking out loud, so keep every reply to one or two short sentences.',
    '',
    'Screen awareness:',
    '- The conversation has a screen next to it, and some of your tools draw on it.',
    '- When a tool tells you it has rendered something, that thing is already visible.',
    '  Say one short sentence about it and move on. Never read a rendered panel out',
    '  field by field, and never spell out numbers, lists or tables the user can see.',
    '- Reach for "render_ui" when a spoken answer would be hard to follow: comparisons,',
    '  three or more options, step-by-step instructions, or several figures at once.',
    '  Skip it for short factual answers.',
    '',
    'If you decide to make a tool call, announce it in a few words before you make it.',
  ].join('\n');

const initialAgent = new RealtimeAgent<TSessionContext>({
  name: 'Pulse Assistant',
  voice: EVoice.ECHO,
  instructions: buildInstructions,
  tools: agentTools,
});

export default initialAgent;
