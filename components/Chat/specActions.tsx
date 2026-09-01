'use client';

import { useChatStore } from '@/hooks/useChatStore/useChatStore';
import { createTextMessage, createDuration } from '@/lib/EventProcessor/messagePayloads';
import type { TJsonRenderAction } from '@/lib/json-render/types';

/**
 * Sends text to the agent as a user turn. In practice `useSession`'s `sendMessage`.
 *
 * @returns Whether it reached a live session.
 */
export type TSendUserTurn = (text: string) => boolean;

/**
 * Signature `JsonRenderSurface` calls its `onAction` prop with. An alias rather than a second
 * declaration: `TJsonRenderAction` is the one canonical shape, so the chat side cannot drift from
 * the render surface it plugs into.
 */
export type TSpecActionHandler = TJsonRenderAction;

/**
 * Identity for an echoed chip.
 *
 * A counter rather than a timestamp: two taps inside the same millisecond produce the same
 * `Date.now()`, and `upsertFinalisedMessage` would then replace the first echo with the second
 * instead of showing both.
 */
let echoCount = 0;
const nextEchoId = () => {
  echoCount += 1;
  return `suggestion-${echoCount}`;
};

/** Reads a string field out of the loosely typed params a fired action carries. */
const readText = (params: Record<string, unknown> | undefined, key: string): string =>
  typeof params?.[key] === 'string' ? (params[key] as string).trim() : '';

/**
 * Dispatches actions fired by generative-UI blocks (`components/json-render/blocks/actions.ts`).
 *
 * - `suggest` — the user tapped a follow-up chip. Its `text` is sent to the agent as if the user
 *   had said it, and — only once the send has succeeded — echoed into the transcript as a user
 *   bubble: `sendMessage` injects a conversation item that the message extractor deliberately does
 *   not render (injected text is normally an instruction to the model, not user speech), so
 *   without the echo the reply would appear with nothing prompting it. Echoing first would put
 *   words in the user's mouth that never left the browser whenever the send fails.
 * - `select` — a documented no-op. The catalog declares it, but no shipped block binds it and
 *   there is no form state for a choice to land in; speaking a bare `value` at the model would
 *   read as nonsense. Wire it when a block needs it.
 */
export const createSpecActionHandler =
  (sendUserTurn: TSendUserTurn): TSpecActionHandler =>
  (actionName, params) => {
    if (actionName === 'suggest') {
      const text = readText(params, 'text') || readText(params, 'value');
      if (!text) {
        console.warn('[json-render] suggest fired without any text to send', params);
        return;
      }
      if (!sendUserTurn(text)) {
        console.warn('[json-render] suggest was not sent — nothing is connected', text);
        return;
      }
      useChatStore
        .getState()
        .upsertFinalisedMessage(createTextMessage(nextEchoId(), 'user', text, createDuration()));
      return;
    }

    if (actionName === 'select') {
      console.debug('json-render "select" is not bound to any behaviour yet', params);
      return;
    }

    console.warn('[json-render] unhandled action', actionName, params);
  };
