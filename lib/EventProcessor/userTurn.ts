import { createDuration, createTextMessage } from '@/lib/chatMessage';
import type { TMessage, TMessageSink, TUserTurnStage } from '@/types';
import type { TransportEvent } from '@openai/agents/realtime';
import {
  asPayload,
  type TDeltaPayload,
  type TItemScopedPayload,
  type TTranscriptDonePayload,
} from './transportPayloads';
import type { TTurnClock } from './turnClock';

/** Shown for a user turn whose transcription the service could not produce. */
const TRANSCRIPTION_UNAVAILABLE = '[transcription unavailable]';

/**
 * How long a committed slot may stay empty before it resolves itself.
 *
 * Input transcription is a best-effort side channel: it runs on the committed audio buffer rather
 * than on the response, so nothing about a healthy conversation guarantees it arrives — or, once
 * started, that it finishes. Without this, such a turn renders "Transcribing…" for the rest of the
 * session. Measured from the commit, not from speech start: a long utterance is not a slow
 * transcription.
 */
const TRANSCRIPTION_TIMEOUT_MS = 15_000;

export type TUserTurnTracker = {
  /** `input_audio_buffer.speech_started` — reserves the turn's slot in the transcript. */
  handleSpeechStarted: (event: TransportEvent) => void;
  /** `input_audio_buffer.committed` — end of speech; transcription starts now. */
  handleCommitted: (event: TransportEvent) => void;
  handleTranscriptDelta: (event: TransportEvent) => void;
  handleTranscriptCompleted: (event: TransportEvent) => void;
  handleTranscriptFailed: (event: TransportEvent) => void;
  reset: () => void;
};

/**
 * Tracks user turns.
 *
 * Input transcription is asynchronous and normally lands *after* the assistant has already started
 * replying, so appending on `completed` would file the user's bubble underneath the reply. Instead
 * the turn claims its slot the moment the user starts talking — `speech_started` already carries
 * the id of the item the turn will become — and is then filled in place, which is what
 * `upsertFinalisedMessage` exists for.
 *
 * Filling happens one delta at a time, but transcription only starts once the buffer is committed,
 * so a short utterance often lands in a single frame. `pending` keeps the cue up until the turn
 * actually resolves, so a slow one reads as in-progress rather than as finished and truncated.
 */
export const createUserTurnTracker = (sink: TMessageSink, clock: TTurnClock): TUserTurnTracker => {
  const turns = new Map<string, TMessage>();
  /**
   * Slots still open, keyed by item. The value is the timer armed at commit; while still listening
   * there is nothing to time out and only the key matters.
   */
  const pending = new Map<string, ReturnType<typeof setTimeout> | undefined>();

  /**
   * True when a slot holds nothing the user actually said. The placeholder counts as empty: a late
   * *empty* `completed` must still be able to retract a slot the timeout has already filled, or a
   * slow-transcribing cough stays on screen for the rest of the session.
   */
  const isEmpty = (content: string) => !content.trim() || content === TRANSCRIPTION_UNAVAILABLE;

  const read = (itemId: string): TMessage =>
    turns.get(itemId) ?? createTextMessage(itemId, 'user', '', createDuration());

  /** Already resolved — by `completed`, by `failed` or by the timeout. */
  const isResolved = (itemId: string) => turns.has(itemId) && !pending.has(itemId);

  const settle = (itemId: string) => {
    clearTimeout(pending.get(itemId));
    pending.delete(itemId);
  };

  /**
   * Writes the slot's current state to the transcript, leaving it open.
   *
   * Deltas go through here rather than through `resolve`, so the timeout stays armed across a
   * partial transcript: a stream that produces three words and then stops is every bit as unfilled
   * as one that never started, and it is the timeout that has to notice.
   */
  const commit = (message: TMessage, stage: TUserTurnStage) => {
    const open = { ...message, pending: stage };
    turns.set(open.id, open);
    if (!pending.has(open.id)) {
      pending.set(open.id, undefined);
    }
    sink.upsertFinalisedMessage(open);
  };

  /** Writes the slot's final state: nothing more is coming, so the cue comes off. */
  const resolve = (message: TMessage) => {
    settle(message.id);
    const closed = { ...message, pending: undefined };
    turns.set(closed.id, closed);
    sink.upsertFinalisedMessage(closed);
  };

  /** Retracts a slot whose audio held nothing worth showing. */
  const discard = (itemId: string) => {
    settle(itemId);
    turns.delete(itemId);
    sink.removeFinalisedMessage(itemId);
  };

  /**
   * Resolves a slot that has audio behind it but no transcript to show for it. Whatever partial
   * text did arrive is kept — a truncated sentence still says more than the placeholder does.
   */
  const markUnavailable = (itemId: string) => {
    const turn = read(itemId);
    resolve({
      ...turn,
      content: turn.content.trim() ? turn.content : TRANSCRIPTION_UNAVAILABLE,
    });
  };

  return {
    handleSpeechStarted: (event) => {
      const { item_id: itemId } = asPayload<TItemScopedPayload>(event);
      if (!itemId || turns.has(itemId)) {
        return;
      }
      commit(read(itemId), 'listening');
    },
    handleCommitted: (event) => {
      const { item_id: itemId } = asPayload<TItemScopedPayload>(event);
      if (!itemId || isResolved(itemId) || pending.get(itemId) !== undefined) {
        return;
      }
      // Reserves the slot too, for a transport that commits without a preceding `speech_started`.
      commit(read(itemId), 'transcribing');
      pending.set(
        itemId,
        setTimeout(() => {
          pending.delete(itemId);
          markUnavailable(itemId);
        }, TRANSCRIPTION_TIMEOUT_MS),
      );
    },
    handleTranscriptDelta: (event) => {
      const { item_id: itemId, delta } = asPayload<TDeltaPayload>(event);
      if (!itemId || !delta || isResolved(itemId)) {
        // Appending to a resolved slot would reopen a bubble with no timer left to close it.
        return;
      }
      const turn = read(itemId);
      commit(
        {
          ...turn,
          content: turn.content + delta,
          duration: {
            ...turn.duration,
            textStart: turn.duration.textStart || clock.sinceSpeechStart(),
          },
        },
        'transcribing',
      );
    },
    handleTranscriptCompleted: (event) => {
      const { item_id: itemId, transcript } = asPayload<TTranscriptDonePayload>(event);
      if (!itemId) {
        return;
      }
      const turn = read(itemId);
      const content = transcript?.trim() ? transcript : turn.content;
      if (isEmpty(content)) {
        // The service transcribed the audio and heard nothing — a cough, a door, a stray sound
        // that tripped server VAD. Falling back to the (empty) accumulated content would leave the
        // bubble stuck on "Transcribing…" forever. A non-event leaves no trace.
        discard(itemId);
        return;
      }
      resolve({
        ...turn,
        content,
        duration: { ...turn.duration, textEnd: clock.sinceSpeechStart() },
      });
    },
    handleTranscriptFailed: (event) => {
      const { item_id: itemId } = asPayload<TItemScopedPayload>(event);
      if (!itemId) {
        return;
      }
      // Unlike an empty `completed`, this means there *was* speech the service could not read, so
      // the slot is kept: the assistant may well have replied to it.
      markUnavailable(itemId);
    },
    reset: () => {
      // Every slot still open is resolved, mirroring the assistant tracker: the transcript survives
      // a disconnect, and an unresolved slot would show its cue forever with nothing left running
      // to finish it. Resolving clears each slot's timer, so `pending` is empty after this loop.
      [...pending.keys()].forEach(markUnavailable);
      turns.clear();
    },
  };
};
