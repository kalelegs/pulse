/**
 * The stopwatch behind `TDuration`. Every number a message carries is milliseconds since the start
 * of the turn it belongs to: the assistant's response for assistant messages, the user's speech
 * for user messages. Zero means "never measured".
 */
export type TTurnClock = {
  /** Called on `response.created`. */
  startResponse: () => void;
  /** Called when the user starts speaking. */
  startSpeech: () => void;
  sinceResponseStart: () => number;
  sinceSpeechStart: () => number;
  /**
   * The instant `sinceResponseStart` currently measures against, or 0 before the first response.
   *
   * Handed out so a measurement that spans the start of the *next* response can still be taken
   * against the response it belongs to: `output_audio_buffer.stopped` may arrive after
   * `response.created` has already moved the clock on.
   */
  responseEpoch: () => number;
  /** Milliseconds since an epoch taken earlier from `responseEpoch`. */
  since: (epoch: number) => number;
  reset: () => void;
};

const elapsedSince = (startedAt: number) =>
  startedAt === 0 ? 0 : Math.round(performance.now() - startedAt);

export const createTurnClock = (): TTurnClock => {
  let responseStartedAt = 0;
  let speechStartedAt = 0;

  return {
    startResponse: () => {
      responseStartedAt = performance.now();
    },
    startSpeech: () => {
      speechStartedAt = performance.now();
    },
    sinceResponseStart: () => elapsedSince(responseStartedAt),
    sinceSpeechStart: () => elapsedSince(speechStartedAt),
    responseEpoch: () => responseStartedAt,
    since: elapsedSince,
    reset: () => {
      responseStartedAt = 0;
      speechStartedAt = 0;
    },
  };
};
