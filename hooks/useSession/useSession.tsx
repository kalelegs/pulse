'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TRealtimeUserInput,
  TSessionContext,
  TUseSessionOptions,
  TUseSessionRetval,
} from '@/types';
import { RealtimeSession } from '@openai/agents/realtime';
import { closeSession, createSession, stopMediaStream } from './fns';

export const useSession = (options: TUseSessionOptions): TUseSessionRetval => {
  // used for reactive nature
  const [session, setSession] = useState<RealtimeSession<TSessionContext>>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();
  // the actual session object
  const sessionRef = useRef<RealtimeSession<TSessionContext>>(undefined);
  // the microphone we handed to the transport. It is ours to stop: `close()` leaves the tracks of a
  // caller supplied stream running, so without this the mic indicator stays lit after disconnect.
  const mediaStreamRef = useRef<MediaStream>(undefined);
  const isUnmountedRef = useRef(false);
  // guards against a second connect acquiring a microphone the first one would overwrite
  const isConnectingRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  /** Releases everything we own. Never touches React state, so it is safe during unmount. */
  const teardown = useCallback(() => {
    closeSession(sessionRef.current);
    sessionRef.current = undefined;
    stopMediaStream(mediaStreamRef.current);
    mediaStreamRef.current = undefined;
  }, []);

  const disconnect = useCallback(() => {
    teardown();
    setSession(undefined);
  }, [teardown]);

  const connect = useCallback(async () => {
    if (sessionRef.current || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;
    setIsLoading(true);
    setError(undefined);
    try {
      const { session: nextSession, mediaStream } = await createSession(optionsRef.current);

      if (isUnmountedRef.current) {
        // Unmounted mid-connect: nobody is left to own the session or the microphone.
        closeSession(nextSession);
        stopMediaStream(mediaStream);
        return;
      }

      sessionRef.current = nextSession;
      mediaStreamRef.current = mediaStream;
      setSession(nextSession);

      try {
        optionsRef.current.onConnect?.();
      } catch (handlerError) {
        // A failing handler must not tear down an otherwise healthy session.
        console.error('onConnect handler failed', handlerError);
      }
    } catch (connectError) {
      console.error('failed to connect realtime session', connectError);
      // createSession releases the microphone on every failure path, but tear down again so the
      // refs cannot survive a half-connected attempt.
      teardown();
      setSession(undefined);
      setError(connectError instanceof Error ? connectError : new Error(String(connectError)));
    } finally {
      isConnectingRef.current = false;
      setIsLoading(false);
    }
  }, [teardown]);

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
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      teardown();
    };
  }, [teardown]);

  return {
    session,
    isLoading,
    isConnected: session !== undefined,
    error,
    sendMessage,
    connect,
    disconnect,
    toggleConnect: toggle,
  };
};
