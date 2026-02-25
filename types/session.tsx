import { RealtimeSession, TransportEvent } from '@openai/agents/realtime';
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
  onDisconnect?: () => void;
  onTransportEvent?: (e: TransportEvent) => void;
};

export type TUseSessionRetval = {
  session?: RealtimeSession<TSessionContext>;
  isLoading: boolean;
  isConnected: boolean;
  sendMessage: (message: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  // connects if disconnected and vice versa
  toggleConnect: () => void;
};
