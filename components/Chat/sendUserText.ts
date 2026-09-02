'use client';

import { useChatStore } from '@/hooks/useChatStore/useChatStore';
import { createDuration, createTextMessage } from '@/lib/chatMessage';

/**
 * Sends text to the agent as a user turn. In practice `useSession`'s `sendMessage`.
 *
 * @returns Whether it reached a live session.
 */
export type TSendUserTurn = (text: string) => boolean;

/** Where a piece of user text came from. Only used to label its echo and its warnings. */
export type TUserTextSource = 'suggestion' | 'typed';

/**
 * Sends `text` as a user turn and, once the send succeeded, echoes it into the transcript.
 *
 * @returns Whether the text reached a live session (and so was echoed).
 */
export type TUserTextSender = (text: string, source: TUserTextSource) => boolean;

/**
 * Identity for an echoed message.
 *
 * A counter rather than a timestamp: two sends inside the same millisecond produce the same
 * `Date.now()`, and `upsertFinalisedMessage` would then replace the first echo with the second
 * instead of showing both. Module-level so every sender in the page draws from the same sequence.
 */
let echoCount = 0;
const nextEchoId = (source: TUserTextSource) => {
  echoCount += 1;
  return `${source}-${echoCount}`;
};

/**
 * The one path by which app-originated user text — a tapped suggestion chip or a typed message —
 * reaches the agent. `sendMessage` injects a conversation item the extractor deliberately does not
 * render, so the text is echoed into the transcript here instead, and only **after** the send
 * succeeded: echoing first would show the user saying something the model has no record of, with
 * no reply ever coming. The reasoning is in `./README.md`, "Generative UI".
 */
export const createUserTextSender =
  (sendUserTurn: TSendUserTurn): TUserTextSender =>
  (text, source) => {
    const trimmed = text.trim();
    if (!trimmed) {
      console.warn(`[chat] ${source} fired without any text to send`);
      return false;
    }
    if (!sendUserTurn(trimmed)) {
      console.warn(`[chat] ${source} text was not sent — nothing is connected`, trimmed);
      return false;
    }
    useChatStore
      .getState()
      .upsertFinalisedMessage(
        createTextMessage(nextEchoId(source), 'user', trimmed, createDuration()),
      );
    return true;
  };
