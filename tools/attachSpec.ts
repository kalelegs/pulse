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
 * ## Why this is not one line
 *
 * A tool call splits one assistant turn into two conversation items, and the
 * transport orders them like this — verified by replaying the repo's own
 * `events.log.json` through `createMessageExtractor`:
 *
 * 1. `response.output_audio_transcript.done` for the announcement item ("let me
 *    check that") — `assistantTurn` finalises it and clears `activeMessage`.
 * 2. `response.output_item.done` for the `function_call` item — where the agents
 *    SDK invokes `execute`.
 * 3. A fresh `response.created` once the tool output is submitted, and only then
 *    `response.output_item.added` for the answer bubble.
 *
 * So at `execute` time `activeMessage` is `undefined`, and
 * `attachSpecToMessage(spec)` with no id is a silent no-op — the store's no-id
 * path deliberately leaves `finalisedMessages` alone. Nor can the tool be handed
 * the right id: `ToolCallDetails.toolCall` is the *function_call* item, not the
 * message item, and the answer bubble does not exist yet — `execute` has to
 * return before the SDK submits the output that creates it.
 *
 * This function therefore returns immediately and finishes from a store
 * subscription: it claims the answer bubble as its target and attaches with an
 * explicit id.
 *
 * ## Which bubble it claims
 *
 * A new assistant bubble is not enough on its own. Step 2 happens *inside* a
 * response, and a response may legally emit another message item after its
 * `function_call` — a late "one moment…" would then be claimed as the answer.
 * The target must therefore be new **and** belong to a response that started
 * after `execute` ran, which is what `sessionEpoch`'s sibling `responseId`
 * records: the tool captures the response it was called from and waits for a
 * bubble from a different one. A transport that does not label its responses
 * leaves `responseId` `undefined`, and the claim falls back to "the next new
 * bubble".
 *
 * ## Why the subscription looks at `previous`
 *
 * A zustand subscriber runs on *every* `set`, not only on the ones it cares
 * about, so "is this bubble a valid target right now?" has to be asked at the
 * right moment as well as of the right bubble. `responseId` and `activeMessage`
 * are written by two different `set` calls, and the responses overlap on the
 * wire: `response.created(B)` can arrive before `response.done(A)`
 * (`lib/EventProcessor/responseTracker.tsx`). On that `setResponseId(B)`
 * notification the store still holds a bubble owned by **A**, which then passes
 * every check — new, assistant, and `responseId !== responseId-at-execute` —
 * and the card lands on the wrong bubble.
 *
 * The listener therefore compares `state` with `previous` and acts only on the
 * `setActiveMessage` that *opens* a bubble, the one notification where
 * `responseId` genuinely describes the bubble's owner. Skipping the
 * `setResponseId` notification costs nothing: the bubble it was about does not
 * exist yet, and its own `setActiveMessage` follows immediately after.
 *
 * ## When it attaches
 *
 * At step 3, on the `setActiveMessage` that opens the bubble — the earliest
 * moment the target exists, roughly one round trip after `execute` returns and
 * before the first transcript delta. The spec survives everything that happens
 * to the bubble afterwards: `appendContentToActiveMessage` and
 * `assistantTurn.finalise` both copy the active message, so the card is already
 * on screen while the answer is spoken and stays on the finalised transcript.
 * Nothing renders it as a skeleton — specs are built whole by typed TypeScript,
 * and `AssistantMessage` does not pass `loading` to the render surface.
 *
 * Ids seen at `execute` time are excluded, so the announcement bubble — active
 * or already finalised — is never the target. Concurrent tool calls each claim
 * the same answer bubble; a message holds one spec, so the last to resolve wins
 * and the overwrite is warned about.
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
