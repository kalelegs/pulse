'use client';

import { RealtimeAgent } from '@openai/agents/realtime';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';
import { RunContext } from '@openai/agents';
import {
  AGENT_VOICE,
  HANDOFF_LINES,
  preferenceLines,
  replyStyleLine,
  SCREEN_AWARENESS_LINES,
  toolCallLine,
} from '@/agents/shared';
import { assistantTools } from '@/tools';
import { TSessionContext } from '@/types';

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
 * The same economy applies to handoffs: this prompt names no specialist. The
 * SDK builds a `transfer_to_<name>` tool for every agent in `handoffs`, each
 * described by that agent's `handoffDescription`, so `HANDOFF_LINES` only has
 * to say that such tools exist. See `agents/index.ts` for the wiring.
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
    replyStyleLine(runContext.context.mode),
    '',
    ...SCREEN_AWARENESS_LINES,
    '',
    ...HANDOFF_LINES,
    '',
    toolCallLine(runContext.context.mode),
  ].join('\n');

/**
 * The root agent: the one a session starts on and the one specialists hand
 * back to. Its `handoffs` are filled in by `agents/index.ts`, never here, so
 * this module stays free of any reference to the specialists.
 */
const initialAgent = new RealtimeAgent<TSessionContext>({
  name: 'Pulse Assistant',
  voice: AGENT_VOICE,
  handoffDescription:
    'General assistant: weather, small talk, and anything not covered by a specialist.',
  instructions: buildInstructions,
  tools: assistantTools,
});

export default initialAgent;
