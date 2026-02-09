'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getEphemeralToken } from '@/actions/getEphemeralToken';
import { RealtimeSession, OpenAIRealtimeWebRTC } from '@openai/agents/realtime';
import initialAgent from '@/agents/initial';
import { TUseSessionOptions, TUseSessionRetval } from './types';

const createSession = async (
  audioElement?: HTMLAudioElement | null,
): Promise<RealtimeSession<unknown>> => {
  const apiKey = await getEphemeralToken();

  const session = new RealtimeSession(initialAgent, {
    model: 'gpt-realtime',
    transport: new OpenAIRealtimeWebRTC(audioElement ? { audioElement } : undefined),
  });

  await session.connect({ apiKey });
  return session;
};

const useSession = (options?: TUseSessionOptions): TUseSessionRetval => {
  const [session, setSession] = useState<RealtimeSession>();
  const [isLoading, setIsLoading] = useState(false);
  const sessionRef = useRef<RealtimeSession>(undefined);
  const audioRef = options?.audioRef;

  const sendMessage = useCallback((message: string) => {
    if (!sessionRef.current || !message.trim()) {
      return;
    }
    sessionRef.current.sendMessage(message);
  }, []);

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
    return () => {
      sessionRef.current?.close();
      sessionRef.current = undefined;
    };
  }, []);

  return {
    session,
    isLoading,
    isConnected: session !== undefined,
    sendMessage,
    connect,
    disconnect,
    toggleConnect: toggle,
  };
};

export default useSession;
