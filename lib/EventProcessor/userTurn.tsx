import type { TMessage, TMessageSink } from '@/types/ChatStore';
import type { TransportEvent } from '@openai/agents/realtime';
import {
  asPayload,
  createDuration,
  createTextMessage,
  type TDeltaPayload,
  type TItemScopedPayload,
  type TTranscriptDonePayload,
} from './messagePayloads';
import type { TTurnClock } from './turnClock';

/** Shown for a user turn whose transcription the service could not produce. */
const TRANSCRIPTION_UNAVAILABLE = '[transcription unavailable]';

/**
 * How long a reserved slot may stay empty before it resolves itself.
 *
 * Input transcription normally lands within a second or two, and the session now asks for it
 * explicitly (`TRANSCRIPTION_MODEL`), but it is still a best-effort side channel: it runs on the
 * committed audio buffer rather than on the response, so nothing about a healthy conversation
 * guarantees it arrives — or, once started, that it finishes. Without this, such a turn renders
 * "Transcribing…" for the rest of the session.
 */
const TRANSCRIPTION_TIMEOUT_MS = 15_000;

export type TUserTurnTracker = {
  /** `input_audio_buffer.committed` — reserves the turn's slot in the transcript. */
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
 * the turn claims its slot the moment its audio buffer is committed and is then filled in place,
 * which is what `upsertFinalisedMessage` exists for.
 *
 * Filling happens one delta at a time, so the bubble grows word by word rather than jumping from
 * empty to whole. How much of that is *visible* is the service's call, not ours: transcription
 * only starts once the buffer is committed, and a short utterance is often transcribed fast enough
 * that every delta lands in the same frame. `isPending` on the message keeps the streaming cue up
 * until the turn actually resolves, so a slow one reads as in-progress rather than as finished and
 * truncated.
 */
export const createUserTurnTracker = (sink: TMessageSink, clock: TTurnClock): TUserTurnTracker => {
  const turns = new Map<string, TMessage>();
  /** Slots reserved but not yet filled, each holding the timer that will resolve it. */
  const pending = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * True when a slot holds nothing the user actually said.
   *
   * The placeholder counts as empty: once the timeout has filled a slot with it, the slot is still
   * waiting to be told what was on the audio, and a late *empty* `completed` — the service saying
   * it heard nothing — must be able to retract it. Treating the placeholder as content is what
   * used to leave a slow-transcribing cough on screen for the rest of the session.
   */
  const isEmpty = (content: string) => !content.trim() || content === TRANSCRIPTION_UNAVAILABLE;

  const read = (itemId: string): TMessage =>
    turns.get(itemId) ?? createTextMessage(itemId, 'user', '', createDuration());

  const settle = (itemId: string) => {
    const timeoutId = pending.get(itemId);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      pending.delete(itemId);
    }
  };

  /**
   * Writes the slot's current state to the transcript, leaving it open.
   *
   * Deltas go through here rather than through `resolve`, so the timeout stays armed across a
   * partial transcript: a stream that produces three words and then stops is every bit as unfilled
   * as one that never started, and it is the timeout that has to notice.
   */
  const commit = (message: TMessage) => {
    const open = { ...message, isPending: true };
    turns.set(open.id, open);
    sink.upsertFinalisedMessage(open);
  };

  /** Writes the slot's final state: nothing more is coming, so the streaming cue comes off. */
  const resolve = (message: TMessage) => {
    settle(message.id);
    const closed = { ...message, isPending: false };
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
    handleCommitted: (event) => {
      const { item_id: itemId } = asPayload<TItemScopedPayload>(event);
      if (!itemId || turns.has(itemId)) {
        return;
      }
      commit(read(itemId));
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
      if (!itemId || !delta) {
        return;
      }
      const turn = read(itemId);
      if (turn.isPending === false) {
        // Already resolved — by `completed`, by `failed` or by the timeout. Appending here would
        // reopen a finished bubble with no timer left to close it again.
        return;
      }
      commit({
        ...turn,
        content: turn.content + delta,
        duration: {
          ...turn.duration,
          textStart: turn.duration.textStart || clock.sinceSpeechStart(),
        },
      });
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
        // that tripped server VAD. Falling back to the (empty) accumulated content here is what
        // used to leave the bubble stuck on "Transcribing…" forever. A non-event leaves no trace.
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
      // Every slot still open is resolved before the timers go, mirroring the assistant tracker:
      // the transcript survives a disconnect, and dropping the timers without resolving would
      // leave a half-transcribed bubble streaming for the rest of the tab's life with nothing left
      // running to finish it.
      [...pending.keys()].forEach(markUnavailable);
      pending.forEach((timeoutId) => clearTimeout(timeoutId));
      pending.clear();
      turns.clear();
    },
  };
};
