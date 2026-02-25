'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TRealtimeUserInput,
  TSessionContext,
  TUseSessionOptions,
  TUseSessionRetval,
} from '@/types';
import { getEphemeralToken } from '@/actions/getEphemeralToken';
import initialAgent from '@/agents/initial';
import { OpenAIRealtimeWebRTC, RealtimeSession, TransportEvent } from '@openai/agents/realtime';

const createSession = async (
  options: TUseSessionOptions,
): Promise<RealtimeSession<TSessionContext>> => {
  const audioElement = options.audioRef?.current;
  const apiKey = await getEphemeralToken();

  const session = new RealtimeSession<TSessionContext>(initialAgent, {
    model: 'gpt-realtime',
    transport: new OpenAIRealtimeWebRTC(audioElement ? { audioElement } : undefined),
    context: options.context,
  });

  // events ref: https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/#transport_event
  session.on('transport_event', (te: TransportEvent) => {
    console.debug('transport event', te);
    // call upstream
    options.onTransportEvent?.(te);
  });
  await session.connect({ apiKey });
  return session;
};

export const useSession = (options: TUseSessionOptions): TUseSessionRetval => {
  // used for reactive nature
  const [session, setSession] = useState<RealtimeSession<TSessionContext>>();
  const [isLoading, setIsLoading] = useState(false);
  // the actual session object
  const sessionRef = useRef<RealtimeSession<TSessionContext>>(undefined);
  const optionsRef = useRef(options);
  optionsRef.current = options;

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
      const nextSession = await createSession(optionsRef.current);
      sessionRef.current = nextSession;
      setSession(nextSession);
      optionsRef.current.onConnect?.();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (session !== undefined) {
      disconnect();
      return;
    }

    await connect();
  }, [session, connect, disconnect]);

  const sendMessage = useCallback((message: TRealtimeUserInput) => {
    if (!sessionRef.current) {
      return;
    }
    if (typeof message === 'string' && !message.trim()) {
      // empty message
      return;
    }
    sessionRef.current.sendMessage(message);
  }, []);

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
