import { getEphemeralToken } from '@/actions/getEphemeralToken';
import { rootAgent } from '@/agents';
import {
  OpenAIRealtimeWebRTC,
  RealtimeItem,
  RealtimeSession,
  TransportEvent,
} from '@openai/agents/realtime';
import { TSessionContext, TSessionMode, TUseSessionOptions } from '@/types';
import type { RefObject } from 'react';
import { REALTIME_MODEL, TRANSCRIPTION_LANGUAGE, TRANSCRIPTION_MODEL } from '@/lib/realtimeConfig';
import { createSilentAudioInput, requestMicrophone, stopMediaStream } from './microphone';

/** How long we wait for the transport to finish its SDP exchange before giving up. */
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * A connected session together with the input stream it is using — the microphone in voice mode,
 * a silent track in text mode.
 *
 * The stream is handed back to the caller because the transport does **not** stop the tracks of a
 * caller supplied `mediaStream` on `close()` — that stream belongs to the application, so the
 * application has to stop it or the browser keeps the microphone indicator lit.
 */
export type TCreatedSession = {
  session: RealtimeSession<TSessionContext>;
  mediaStream: MediaStream;
};

/** Closes a session without letting transport cleanup errors escape. */
export const closeSession = (session?: RealtimeSession<TSessionContext>) => {
  try {
    session?.close();
  } catch (error) {
    console.error('failed to close realtime session', error);
  }
};

/**
 * Creates and connects a realtime session.
 *
 * The input stream is acquired up front and passed to the transport, which then skips its own
 * `getUserMedia` call. In voice mode that is the microphone; in text mode it is a silent track, the
 * model is asked for text-only output, and no audio element is attached, so nothing is heard or
 * captured. Every failure path after acquisition releases the stream again.
 *
 * @param optionsRef The caller's live options. Connect-time configuration is read once, but the
 *   event handlers are read per event so a re-render can replace them.
 * @param mode Voice or text; see `TSessionMode`.
 */
export const createSession = async (
  optionsRef: RefObject<TUseSessionOptions>,
  mode: TSessionMode,
): Promise<TCreatedSession> => {
  const options = optionsRef.current;
  const isVoice = mode === 'voice';
  const audioElement = isVoice ? options.audioRef?.current : undefined;
  const mediaStream = isVoice ? await requestMicrophone() : createSilentAudioInput();

  let session: RealtimeSession<TSessionContext> | undefined;
  let connectTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let connectTimedOut = false;

  try {
    const apiKey = await getEphemeralToken();

    const nextSession = new RealtimeSession<TSessionContext>(rootAgent, {
      model: REALTIME_MODEL,
      transport: new OpenAIRealtimeWebRTC({ ...(audioElement && { audioElement }), mediaStream }),
      context: options.context,
      // Repeats what the ephemeral token already asked for, on purpose: the SDK's own
      // `session.update` on connect would otherwise overwrite it. Why, and why the model is pinned,
      // is written up at `lib/realtimeConfig.ts` and in `./README.md`.
      config: {
        outputModalities: [isVoice ? 'audio' : 'text'],
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
