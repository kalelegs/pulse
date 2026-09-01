import type { TDuration, TMessageSink } from '@/types/ChatStore';
import { createDuration } from './messagePayloads';
import type { TTurnClock } from './turnClock';

/**
 * The `TDuration` an assistant message carries, measured with `TTurnClock`.
 *
 * Split out of `./assistantTurn` because one of the four numbers cannot be measured before the
 * message is written: audio finishes *playing* after the transcript `.done` that finalises it
 * (`output_audio_buffer.stopped` lands after `response.output_audio_transcript.done` in every turn
 * of `events.log.json`), so `audioEnd` has to be upserted onto the transcript afterwards rather
 * than mutated into a value the message has already copied.
 */
export type TTurnDurations = {
  /** Starts a fresh measurement and returns the snapshot for the new bubble. */
  begin: () => TDuration;
  /** Records the first text of the item. Ignored afterwards. */
  recordTextStart: () => void;
  /**
   * @param itemId The item speaking right now. `output_audio_buffer.*` carries a response id
   *   rather than an item id, so the item — and the response clock its playback is measured
   *   against — have to be remembered here.
   */
  recordAudioStart: (itemId: string | undefined) => void;
  /** Stamps `audioEnd` on the item that started playing, against that item's response clock. */
  recordAudioEnd: () => void;
  /** The measurement for the item being finalised, with `textEnd` stamped now. */
  close: () => TDuration;
  reset: () => void;
};

/** The item currently playing, and the response clock its playback is timed against. */
type TAudioSpan = {
  itemId: string;
  epoch: number;
};

export const createTurnDurations = (sink: TMessageSink, clock: TTurnClock): TTurnDurations => {
  let active = createDuration();
  /** Set by `output_audio_buffer.started`, cleared by the `.stopped` that answers it. */
  let audio: TAudioSpan | undefined;

  return {
    begin: () => {
      active = createDuration();
      return { ...active };
    },
    recordTextStart: () => {
      if (active.textStart === 0) {
        active.textStart = clock.sinceResponseStart();
      }
    },
    recordAudioStart: (itemId) => {
      // A span still open here belongs to an item whose `.stopped` never arrived (the log shows
      // three `started` against two `stopped`). Dropping it leaves that item's `audioEnd` at 0 —
      // "never measured" — rather than crediting this item's playback to it.
      audio = itemId ? { itemId, epoch: clock.responseEpoch() } : undefined;
      active.audioStart = clock.sinceResponseStart();
    },
    recordAudioEnd: () => {
      const span = audio;
      audio = undefined;
      // Deliberately not written to `active`: `active` is the item streaming *now*, which by this
      // point may already be the next response's. The number belongs to `span.itemId` alone, and
      // is measured against the response that item was spoken in — `response.created` for the
      // next response may have moved the clock on already.
      const message = span ? sink.getFinalisedMessage(span.itemId) : undefined;
      if (!span || !message) {
        return;
      }
      sink.upsertFinalisedMessage({
        ...message,
        duration: { ...message.duration, audioEnd: clock.since(span.epoch) },
      });
    },
    close: () => ({ ...active, textEnd: clock.sinceResponseStart() }),
    reset: () => {
      active = createDuration();
      audio = undefined;
    },
  };
};
