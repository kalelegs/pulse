'use client';

import { useChatStore } from '@/hooks/useChatStore/useChatStore';
import type { TJsonRenderSpec } from '@/lib/json-render/types';

/**
 * How long the reply bubble has to appear before the spec is abandoned.
 *
 * This is not a rendering delay — the spec attaches the instant the bubble opens. It only bounds
 * the wait for a bubble that may never come, so it is sized for a single server round trip
 * (submit tool output → `response.created` → `response.output_item.added`), not for a spoken
 * answer.
 */
const REPLY_WINDOW_MS = 10_000;

/** Ids of every assistant message that already exists, streaming or finalised. */
const knownAssistantIds = (): Set<string> => {
  const { activeMessage, finalisedMessages } = useChatStore.getState();
  const ids = new Set(finalisedMessages.map((message) => message.id));

  if (activeMessage) {
    ids.add(activeMessage.id);
  }

  return ids;
};

/**
 * Attaches a generative-UI spec to the assistant bubble the user reads as
 * *the answer*.
 *
 * It cannot be `attachSpecToMessage(spec)`: a tool call splits the turn into an
 * announcement bubble (already finalised when `execute` runs) and an answer
 * bubble (not created until after `execute` returns), so at call time there is
 * no active message to attach to. This returns immediately and finishes from a
 * store subscription, claiming the first assistant bubble that is both unseen
 * at `execute` time and from a later response than the one the tool ran in,
 * then attaching with that bubble's explicit id. The full event ordering, the
 * overlapping-responses race and the abandon rules are in `tools/README.md`.
 *
 * @param spec Fully built, already valid spec.
 */
export const attachSpecToReply = (spec: TJsonRenderSpec): void => {
  const seen = knownAssistantIds();
  // The session this tool ran in, and the response it ran inside. Both are captured now because
  // both are what "the bubble I am waiting for" is defined relative to.
  const { sessionEpoch, responseId } = useChatStore.getState();

  let unsubscribe: (() => void) | undefined;

  const abandon = (reason: string) => {
    settle();
    console.warn(`[json-render] the spec was not attached: ${reason}`);
  };

  const timeoutId = setTimeout(
    () => abandon('no assistant reply appeared within the reply window'),
    REPLY_WINDOW_MS,
  );

  const settle = () => {
    unsubscribe?.();
    unsubscribe = undefined;
    clearTimeout(timeoutId);
  };

  unsubscribe = useChatStore.subscribe((state, previous) => {
    // `useChatStore.reset()` runs on every connect and bumps the epoch. Anything from the previous
    // session is stale, so give up rather than staple a stale card onto the next session's first
    // reply. Emptiness is deliberately *not* the signal: `userTurn.discard()` can retract the only
    // message in a live session's transcript, which used to abandon a perfectly good attach.
    if (state.sessionEpoch !== sessionEpoch) {
      abandon('the session ended before the reply arrived');
      return;
    }

    // Only the notification that *opens* a bubble is a claim opportunity — see the doc comment
    // above. Every other `set` (a delta, and crucially `setResponseId`) leaves the id alone.
    if (state.activeMessage?.id === previous.activeMessage?.id) {
      return;
    }

    const active = state.activeMessage;
    if (!active || active.role !== 'assistant' || seen.has(active.id)) {
      return;
    }
    // Unknown ids fall back to "the next new bubble" — see the doc comment above.
    if (state.responseId !== undefined && state.responseId === responseId) {
      return;
    }

    settle();
    if (active.spec) {
      console.warn(
        '[json-render] replacing the spec already attached to',
        active.id,
        '— two tools in one turn both claimed the reply bubble, and only the last card survives.',
      );
    }
    state.attachSpecToMessage(spec, active.id);
  });
};
