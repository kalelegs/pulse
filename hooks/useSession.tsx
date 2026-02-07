'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { getEphemeralToken } from '@/actions/getEphemeralToken';
import { RealtimeSession, OpenAIRealtimeWebRTC } from '@openai/agents/realtime';
import initialAgent from '@/agents/initial';

export type TUseSessionOptions = {
  /**
   * Ref to a rendered <audio> element. When provided it is passed to the
   * WebRTC transport layer so audio playback starts without the "cold-start"
   * delay that happens on the very first connection.
   */
  audioRef?: RefObject<HTMLAudioElement | null>;
};

export type TUseSessionResponse = {
  session?: RealtimeSession<unknown>;
  isLoading: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggle: () => void;
};

const createSession = async (
  audioElement?: HTMLAudioElement | null,
): Promise<RealtimeSession<unknown>> => {
  const apiKey = await getEphemeralToken();
  console.debug('received ephemeral apiKey: ' + apiKey);

  const session = new RealtimeSession(initialAgent, {
    model: 'gpt-realtime',
    transport: new OpenAIRealtimeWebRTC(audioElement ? { audioElement } : undefined),
  });

  await session.connect({ apiKey });
  return session;
};

const useSession = (options?: TUseSessionOptions): TUseSessionResponse => {
  const [session, setSession] = useState<RealtimeSession>();
  const [isLoading, setIsLoading] = useState(false);
  const sessionRef = useRef<RealtimeSession>(undefined);
  const audioRef = options?.audioRef;

  const disconnect = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = undefined;
    setSession(undefined);
  }, []);

  const connect = useCallback(async () => {
    if (sessionRef.current) {
      return;
    }

    setIsLoading(true);
    try {
      const nextSession = await createSession(audioRef?.current);
      sessionRef.current = nextSession;
      setSession(nextSession);
    } finally {
      setIsLoading(false);
    }
  }, [audioRef]);

  const toggle = useCallback(async () => {
    if (session !== undefined) {
      disconnect();
      return;
    }

    await connect();
  }, [session, connect, disconnect]);

  useEffect(() => {
    // un comment for auto connect
    // void connect();

    return () => {
      sessionRef.current?.close();
      sessionRef.current = undefined;
    };
  }, [connect]);

  return {
    session,
    isLoading,
    isConnected: session !== undefined,
    connect,
    disconnect,
    toggle,
  };
};

export default useSession;
