'use client';

import { useChatStore } from '@/hooks/useChatStore/useChatStore';
import { createDuration, createTextMessage } from '@/lib/chatMessage';
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
 * Dispatches actions fired by generative-UI blocks. `suggest` sends the chip's text as a user turn
 * and echoes it only once the send succeeded; `select` is a documented no-op. The reasoning is in
 * `./README.md`, "Generative UI".
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
