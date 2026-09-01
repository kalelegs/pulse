import { getEphemeralToken } from '@/actions/getEphemeralToken';
import initialAgent from '@/agents/initial';
import {
  OpenAIRealtimeWebRTC,
  RealtimeItem,
  RealtimeSession,
  TransportEvent,
} from '@openai/agents/realtime';
import { TSessionContext, TUseSessionOptions } from '@/types';
import type { RefObject } from 'react';
import { REALTIME_MODEL, TRANSCRIPTION_LANGUAGE, TRANSCRIPTION_MODEL } from '@/lib/utils';

/**
 * How long we wait for the browser microphone prompt to be answered. An unanswered prompt leaves
 * `getUserMedia` pending *forever* (it never rejects), which is what used to hang `connect()`.
 */
const MIC_PERMISSION_TIMEOUT_MS = 15_000;

/** How long we wait for the transport to finish its SDP exchange before giving up. */
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * A connected session together with the microphone stream it is using.
 *
 * The stream is handed back to the caller because the transport does **not** stop the tracks of a
 * caller supplied `mediaStream` on `close()` — that stream belongs to the application, so the
 * application has to stop it or the browser keeps the microphone indicator lit.
 */
export type TCreatedSession = {
  session: RealtimeSession<TSessionContext>;
  mediaStream: MediaStream;
};

/** Stops every track of a microphone stream. Safe to call repeatedly and with `undefined`. */
export const stopMediaStream = (stream?: MediaStream) => {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch (error) {
      console.error('failed to stop microphone track', error);
    }
  });
};

/** Closes a session without letting transport cleanup errors escape. */
export const closeSession = (session?: RealtimeSession<TSessionContext>) => {
  try {
    session?.close();
  } catch (error) {
    console.error('failed to close realtime session', error);
  }
};

/** Turns a `getUserMedia` rejection into something a user can act on. */
const micErrorMessage = (error: unknown): string => {
  const name = error instanceof Error ? error.name : '';

  switch (name) {
    case 'NotAllowedError':
      return 'Microphone permission was denied or the prompt was dismissed. Allow microphone access for this site (chrome://settings/content/microphone) and try again.';
    case 'NotFoundError':
      return 'No microphone was found. Connect a microphone and try again.';
    case 'NotReadableError':
      return 'The microphone is already in use by another application. Close the other app and try again.';
    default:
      return `Could not access the microphone${name ? ` (${name})` : ''}. Check your browser microphone settings and try again.`;
  }
};

/**
 * Requests the microphone ourselves rather than letting the transport do it, so that failures carry
 * a precise message and so that an unanswered permission prompt cannot hang forever.
 */
const requestMicrophone = async (timeoutMs = MIC_PERMISSION_TIMEOUT_MS): Promise<MediaStream> => {
  const pending = navigator.mediaDevices.getUserMedia({ audio: true });

  const timeoutError = new Error(
    'Microphone permission was not granted in time. Answer the browser microphone prompt, then try connecting again.',
  );
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
  });

  try {
    return await Promise.race([pending, timeout]);
  } catch (error) {
    if (error === timeoutError) {
      // We gave up waiting, but `pending` may still resolve later with a live microphone that
      // nobody holds a handle to. Stop it as soon as it shows up.
      void pending.then(stopMediaStream, () => undefined);
      throw timeoutError;
    }
    throw new Error(micErrorMessage(error), { cause: error });
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Creates and connects a realtime session.
 *
 * The microphone is acquired up front and passed to the transport, which then skips its own
 * `getUserMedia` call. Every failure path after that acquisition releases the microphone again.
 *
 * @param optionsRef The caller's live options. Connect-time configuration is read once, but the
 *   event handlers are read per event so a re-render can replace them.
 */
const createSession = async (
  optionsRef: RefObject<TUseSessionOptions>,
): Promise<TCreatedSession> => {
  const options = optionsRef.current;
  const audioElement = options.audioRef?.current;
  const mediaStream = await requestMicrophone();

  let session: RealtimeSession<TSessionContext> | undefined;
  let connectTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let connectTimedOut = false;

  try {
    const apiKey = await getEphemeralToken();

    const nextSession = new RealtimeSession<TSessionContext>(initialAgent, {
      model: REALTIME_MODEL,
      transport: new OpenAIRealtimeWebRTC({ ...(audioElement && { audioElement }), mediaStream }),
      context: options.context,
      // Repeats what the ephemeral token already asked for, and it is not redundant: the transport
      // sends a `session.update` the moment the data channel opens, filling every `audio.input`
      // field the app left undefined from `DEFAULT_OPENAI_REALTIME_SESSION_CONFIG`
      // (`@openai/agents-realtime/dist/openaiRealtimeBase.mjs`). Without this the minted session's
      // transcription config is overwritten by the SDK's before the first word is spoken.
      config: {
        audio: {
          input: {
            transcription: { model: TRANSCRIPTION_MODEL, language: TRANSCRIPTION_LANGUAGE },
          },
        },
      },
    });
    session = nextSession;

    // events ref: https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/#transport_event
    nextSession.on('transport_event', (te: TransportEvent) => {
      console.debug('transport event', te);
      // Read through the ref, not the snapshot above: this handler outlives the render that
      // created the session, and the caller rebuilds `onTransportEvent` whenever something it
      // closes over changes (`eventsLogLevel`, from `SettingsPanel`). Closing over the snapshot
      // froze that setting until the next reconnect.
      //
      // Caught for the same reason as `history_updated` below: a throw from here escapes into the
      // SDK's emitter and surfaces as an `error` on a session that is perfectly healthy. The
      // caller guards its two consumers separately as well, so a failure in one cannot starve the
      // other (`components/RealtimeExperience`); this is the outer net for anything else.
      try {
        optionsRef.current.onTransportEvent?.(te);
      } catch (error) {
        console.error('onTransportEvent handler failed', error);
      }
    });

    // The SDK's server-authoritative conversation record, forwarded untouched. Same ref-reading
    // rule as above, plus a swallowing catch: this feeds a debug view only, and a throwing
    // subscriber here would surface as a session `error` event on a session that is perfectly
    // healthy. Nothing downstream may write back — `updateHistory` throws on assistant audio
    // items, so history is read-only for this app (`lib/EventProcessor/SdkHistory.md`).
    nextSession.on('history_updated', (history: RealtimeItem[]) => {
      try {
        optionsRef.current.onHistoryUpdated?.(history);
      } catch (error) {
        console.error('onHistoryUpdated handler failed', error);
      }
    });

    // `close()` cancels an in-flight connection attempt, which turns a hung connect into a
    // rejection instead of leaving the caller waiting forever.
    connectTimeoutId = setTimeout(() => {
      connectTimedOut = true;
      closeSession(nextSession);
    }, CONNECT_TIMEOUT_MS);

    await nextSession.connect({ apiKey });

    return { session: nextSession, mediaStream };
  } catch (error) {
    closeSession(session);
    stopMediaStream(mediaStream);

    if (connectTimedOut) {
      throw new Error(
        `Timed out connecting to the realtime service after ${CONNECT_TIMEOUT_MS / 1000}s. Check your network connection and try again.`,
        { cause: error },
      );
    }
    throw error;
  } finally {
    clearTimeout(connectTimeoutId);
  }
};

export { createSession };
