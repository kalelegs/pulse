import { RealtimeItem, RealtimeSession, TransportEvent } from '@openai/agents/realtime';
import { RefObject } from 'react';

/** Redefined from @openai/agents/realtime/clientMessage as it is not exported from index */
export type TRealtimeUserInput =
  | string
  | {
      type: 'message';
      role: 'user';
      content: (
        | {
            type: 'input_text';
            text: string;
          }
        | {
            type: 'input_image';
            image: string;
            providerData?: Record<string, unknown>;
          }
      )[];
    };

/**
 * This type defines the context shape for session
 */
export type TSessionContext = {
  /** User's Name */
  userName: string;
  preferences: string[];
};

export type TUseSessionOptions = {
  audioRef?: RefObject<HTMLAudioElement | null>;
  context: TSessionContext;

  /** Events */
  onConnect?: () => void;
  /**
   * Fired once per session that actually connected, from the teardown path — an explicit
   * `disconnect()`, a `toggleConnect()` that closes, or unmount. Never fired for a connect that
   * failed. Use it to close out anything that has been accumulating per-session state.
   */
  onDisconnect?: () => void;
  onTransportEvent?: (e: TransportEvent) => void;
  /**
   * Fired with the SDK's whole `session.history` array whenever the SDK rebuilds it.
   *
   * Observation only. The session's history is not a usable transcript source — it has no partial
   * transcripts, it lands after the transport events we already read, and `updateHistory` throws
   * on assistant audio items, so it cannot be written back either (see
   * `lib/EventProcessor/SdkHistory.md`). Treat it as a read-only oracle for debugging, never as
   * input to the chat.
   */
  onHistoryUpdated?: (history: RealtimeItem[]) => void;
};

export type TUseSessionRetval = {
  session?: RealtimeSession<TSessionContext>;
  isLoading: boolean;
  isConnected: boolean;
  /** Set when the last connect attempt failed. Cleared on the next attempt. */
  error?: Error;
  /**
   * Sends a user turn into the live session. Returns whether it reached one — `false` when nothing
   * is connected, or when a text message was blank.
   *
   * Takes the full `TRealtimeUserInput`, not just `string`: the implementation forwards whatever it
   * is given to `session.sendMessage`, so the multi-modal `input_image` branch stays reachable
   * through the hook even though today's callers only send text.
   */
  sendMessage: (message: TRealtimeUserInput) => boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  // connects if disconnected and vice versa
  toggleConnect: () => void;
};
