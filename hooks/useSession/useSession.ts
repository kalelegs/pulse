'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TRealtimeUserInput,
  TSessionContext,
  TSessionMode,
  TUseSessionOptions,
  TUseSessionRetval,
} from '@/types';
import { RealtimeSession } from '@openai/agents/realtime';
import { closeSession, createSession } from './createSession';
import { stopMediaStream } from './microphone';

export const useSession = (options: TUseSessionOptions): TUseSessionRetval => {
  // used for reactive nature
  const [session, setSession] = useState<RealtimeSession<TSessionContext>>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [mode, setMode] = useState<TSessionMode>();
  // the actual session object
  const sessionRef = useRef<RealtimeSession<TSessionContext>>(undefined);
  // the microphone we handed to the transport. It is ours to stop: `close()` leaves the tracks of a
  // caller supplied stream running, so without this the mic indicator stays lit after disconnect.
  const mediaStreamRef = useRef<MediaStream>(undefined);
  const isUnmountedRef = useRef(false);
  // guards against a second connect acquiring a microphone the first one would overwrite
  const isConnectingRef = useRef(false);
  const optionsRef = useRef(options);
  // Written in an effect rather than during render: a render-phase write to a ref is not safe
  // under concurrent React, which may render a component and throw the result away.
  useEffect(() => {
    optionsRef.current = options;
  });

  /** Releases everything we own. Never touches React state, so it is safe during unmount. */
  const teardown = useCallback(() => {
    const hadSession = sessionRef.current !== undefined;
    closeSession(sessionRef.current);
    sessionRef.current = undefined;
    stopMediaStream(mediaStreamRef.current);
    mediaStreamRef.current = undefined;

    if (!hadSession) {
      // A failed connect never had a session to end, so nothing downstream needs closing either.
      return;
    }
    try {
      optionsRef.current.onDisconnect?.();
    } catch (handlerError) {
      // The transport is already down; a failing handler must not escape from cleanup.
      console.error('onDisconnect handler failed', handlerError);
    }
  }, []);

  const disconnect = useCallback(() => {
    teardown();
    setSession(undefined);
    setMode(undefined);
  }, [teardown]);

  const connect = useCallback(
    async (nextMode: TSessionMode) => {
      if (sessionRef.current || isConnectingRef.current) {
        return;
      }

      isConnectingRef.current = true;
      setIsLoading(true);
      setError(undefined);
      setMode(nextMode);
      try {
        const { session: nextSession, mediaStream } = await createSession(optionsRef, nextMode);

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
        setMode(undefined);
        setError(connectError instanceof Error ? connectError : new Error(String(connectError)));
      } finally {
        isConnectingRef.current = false;
        setIsLoading(false);
      }
    },
    [teardown],
  );

  const toggle = useCallback(
    async (nextMode: TSessionMode) => {
      if (session !== undefined) {
        disconnect();
        return;
      }

      await connect(nextMode);
    },
    [session, connect, disconnect],
  );

  const sendMessage = useCallback((message: TRealtimeUserInput) => {
    if (!sessionRef.current) {
      // Nothing is connected, so nothing was said. Reported rather than swallowed: a caller that
      // echoes the message into the transcript would otherwise show the user saying something the
      // model has no record of, with no reply ever coming.
      return false;
    }
    if (typeof message === 'string' && !message.trim()) {
      // empty message
      return false;
    }
    sessionRef.current.sendMessage(message);
    return true;
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
    mode,
    error,
    sendMessage,
    connect,
    disconnect,
    toggleConnect: toggle,
  };
};
