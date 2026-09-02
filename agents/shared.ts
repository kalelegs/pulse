'use client';

import { EVoice } from '@/lib/realtimeConfig';

/**
 * The one voice every agent speaks with.
 *
 * A realtime session cannot change voice once an agent has spoken — the SDK
 * fails the handoff if the next agent's `voice` differs — so specialists must
 * share the root agent's voice, and the constant lives here so they cannot drift.
 */
export const AGENT_VOICE = EVoice.ECHO;

/** The session's preference list as prompt lines, or no lines at all when it is empty. */
export const preferenceLines = (preferences: string[]): string[] =>
  preferences.length
    ? [
        'Things this user has told us they prefer — honour them without being asked:',
        ...preferences.map((preference) => `- ${preference}`),
      ]
    : [];

/**
 * How every agent treats the screen beside the conversation. Shared so a
 * specialist does not narrate a card the root agent would have left to the eye.
 */
export const SCREEN_AWARENESS_LINES: string[] = [
  'Screen awareness:',
  '- The conversation has a screen next to it, and some of your tools draw on it.',
  '- When a tool tells you it has rendered something, that thing is already visible.',
  '  Say one short sentence about it and move on. Never read a rendered panel out',
  '  field by field, and never spell out numbers, lists or tables the user can see.',
  '- Reach for "render_ui" when a spoken answer would be hard to follow: comparisons,',
  '  three or more options, step-by-step instructions, or several figures at once.',
  '  Skip it for short factual answers.',
];

/**
 * When to hand the conversation on. Deliberately names no agent: the SDK
 * generates one `transfer_to_<name>` tool per entry in `handoffs`, described by
 * that agent's own `handoffDescription`, so the prompt only has to say *that*
 * transfers exist. Adding a specialist never touches another agent's prompt.
 */
export const HANDOFF_LINES: string[] = [
  'Hand the conversation to another agent whenever one of your transfer tools describes',
  'the request better than you can serve it. Do it silently — never announce or explain',
  'a transfer, and never tell the user which agent they are talking to.',
];
