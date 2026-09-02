import { createTextMessage } from '@/lib/chatMessage';
import type { TMessageSink } from '@/types';
import type { TransportEvent } from '@openai/agents/realtime';
import { createBargeInLedger } from './bargeIn';
import {
  asPayload,
  type TDeltaPayload,
  type TOutputItemPayload,
  type TTranscriptDonePayload,
} from './transportPayloads';
import { createResponseTracker } from './responseTracker';
import type { TTurnClock } from './turnClock';
import { createTurnDurations } from './turnDurations';

/** Assistant-side handlers, one per transport event that moves an assistant message forward. */
export type TAssistantTurnTracker = {
  handleOutputItemAdded: (event: TransportEvent) => void;
  handleDelta: (event: TransportEvent) => void;
  handleDone: (event: TransportEvent) => void;
  handleInterruption: () => void;
  /** `response.created` — the id the items that follow belong to. See `./responseTracker`. */
  handleResponseCreated: (event: TransportEvent) => void;
  /** `response.done` — closes the turn and resolves that response's barge-ins. */
  handleResponseDone: (event: TransportEvent) => void;
  recordAudioStart: () => void;
  recordAudioEnd: () => void;
  /** Closes whatever is still streaming. */
  finalise: () => void;
  reset: () => void;
};

/**
 * Tracks the assistant message that is currently streaming.
 *
 * One message per conversation item, keyed by the transport `item_id` — which is why a
 * tool-interrupted turn becomes the two bubbles the user actually heard. Message state itself
 * lives in the `sink`, so a spec attached mid-turn survives finalisation. Timing lives in
 * `./turnDurations`, barge-in bookkeeping in `./bargeIn`.
 */
export const createAssistantTurnTracker = (
  sink: TMessageSink,
  clock: TTurnClock,
): TAssistantTurnTracker => {
  let activeItemId: string | undefined;
  /** Items already written to the transcript. Guards against duplicate / late finalisation. */
  const sealedItemIds = new Set<string>();
  const durations = createTurnDurations(sink, clock);
  const bargeIn = createBargeInLedger(sink);

  const begin = (itemId: string) => {
    activeItemId = itemId;
    sink.setActiveMessage(createTextMessage(itemId, 'assistant', '', durations.begin()));
  };

  /**
   * Moves the streaming message into the transcript.
   *
   * `authoritative` (the full text from a `.done` event) wins over the accumulated deltas, so a
   * dropped or duplicated delta cannot corrupt a finalised message. A turn that produced no text
   * at all is discarded rather than rendered as an empty bubble. `seal` is false only for a
   * barge-in, where the item may still have more to say (see `./bargeIn`).
   */
  const finalise = (authoritative?: string, seal = true) => {
    const itemId = activeItemId;
    const streaming = sink.getActiveMessage();
    activeItemId = undefined;
    sink.setActiveMessage(undefined);
    if (!itemId || !streaming) {
      return;
    }
    if (seal) {
      sealedItemIds.add(itemId);
    }
    const content = authoritative?.trim() ? authoritative : streaming.content;
    if (!content.trim()) {
      return;
    }
    sink.upsertFinalisedMessage({ ...streaming, content, duration: durations.close() });
  };

  const seal = (itemIds: string[]) => itemIds.forEach((itemId) => sealedItemIds.add(itemId));
  const responses = createResponseTracker(sink, bargeIn, () => finalise(), seal);

  const handleOutputItemAdded = (event: TransportEvent) => {
    const { item } = asPayload<TOutputItemPayload>(event);
    // Function-call items carry no transcript, so they never become messages.
    if (!item?.id || item.type !== 'message' || item.role !== 'assistant') {
      return;
    }
    if (sealedItemIds.has(item.id) || activeItemId === item.id || bargeIn.has(item.id)) {
      return;
    }
    finalise();
    begin(item.id);
  };

  const handleDelta = (event: TransportEvent) => {
    const { item_id: itemId, delta } = asPayload<TDeltaPayload>(event);
    if (!itemId || !delta) {
      return;
    }
    if (bargeIn.has(itemId)) {
      // Still speaking through the interjection: grow the bubble the user is already reading.
      bargeIn.extend(itemId, delta);
      return;
    }
    if (sealedItemIds.has(itemId)) {
      return;
    }
    if (activeItemId !== itemId) {
      // A new item started before the previous one closed — close it before switching.
      finalise();
      begin(itemId);
    }
    durations.recordTextStart();
    sink.appendContentToActiveMessage(delta);
  };

  const handleDone = (event: TransportEvent) => {
    const payload = asPayload<TTranscriptDonePayload>(event);
    const itemId = payload.item_id;
    if (!itemId) {
      return;
    }
    if (bargeIn.has(itemId)) {
      // Held until `response.done` says whether this text was actually spoken.
      bargeIn.stashDone(itemId, payload.transcript ?? payload.text ?? '');
      return;
    }
    if (sealedItemIds.has(itemId)) {
      return;
    }
    if (activeItemId !== itemId) {
      // `.done` with no preceding active message: the payload still carries the whole text.
      finalise();
      begin(itemId);
    }
    finalise(payload.transcript ?? payload.text);
  };

  /**
   * Barge-in: write down exactly what the user has heard so far, then hand the item to the
   * barge-in ledger. Sealing here would be a guess — the server only cancels the response when
   * turn detection says to, and this app never configures turn detection. A stream that has not
   * produced any text yet is left alone, so a false-positive voice-activity trigger cannot destroy
   * a reply that is about to arrive.
   */
  const handleInterruption = () => {
    const itemId = activeItemId;
    const spoken = sink.getActiveMessage()?.content ?? '';
    if (!itemId || !spoken.trim()) {
      return;
    }
    finalise(undefined, false);
    bargeIn.mark(itemId, spoken, responses.current());
  };

  return {
    handleOutputItemAdded,
    handleDelta,
    handleDone,
    handleInterruption,
    handleResponseCreated: responses.handleCreated,
    handleResponseDone: responses.handleDone,
    recordAudioStart: () => durations.recordAudioStart(activeItemId),
    recordAudioEnd: () => durations.recordAudioEnd(),
    finalise: () => finalise(),
    reset: () => {
      // Keeps whatever the user already heard: a disconnect mid-reply leaves a readable
      // transcript rather than a bubble stuck behind a typing indicator.
      finalise();
      bargeIn.clear();
      durations.reset();
      responses.reset();
      activeItemId = undefined;
      sealedItemIds.clear();
      sink.setActiveMessage(undefined);
    },
  };
};
