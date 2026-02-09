import { RealtimeSession } from '@openai/agents/realtime';
import { RefObject } from 'react';

export type TUseSessionOptions = {
  audioRef?: RefObject<HTMLAudioElement | null>;
};

export type TUseSessionRetval = {
  session?: RealtimeSession<unknown>;
  isLoading: boolean;
  isConnected: boolean;
  sendMessage: (message: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  // connects if disconnected and vie versa
  toggleConnect: () => void;
};
