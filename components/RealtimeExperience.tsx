'use client';

import EventsPanel from '@/components/Events/EventsPanel';
import ConnectButton from '@/components/ConnectButton';
import { useMemo, useRef } from 'react';
import { useSession, useCustomerContext, useChatStore, chatMessageSink } from '@/hooks';
import SettingsPanel from '@/components/SettingsPanel';
import { createSpecActionHandler, MessageList } from '@/components/Chat';

import { createMessageExtractor, processEvent } from '@/lib/EventProcessor';

const RealTimeExperience = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const context = useCustomerContext();
  const addEvent = useChatStore((state) => state.addEvent);
  const eventsLogLevel = useChatStore((state) => state.eventsLogLevel);
  const resetChat = useChatStore((state) => state.reset);
  const setSdkHistory = useChatStore((state) => state.setSdkHistory);
  const resetSdkHistory = useChatStore((state) => state.resetSdkHistory);
  // The extractor carries per-turn state, so it has to outlive renders. `chatMessageSink` reads
  // the store lazily, which keeps this stable for the lifetime of the page.
  const messageExtractor = useMemo(() => createMessageExtractor(chatMessageSink), []);
  const { isLoading, isConnected, error, toggleConnect, sendMessage } = useSession({
    audioRef,
    context,

    /** Event Handlers */
    onConnect: () => {
      // Each connect gets a *fresh* transcript. A realtime session starts with no server-side
      // history, so carrying the previous conversation over would show the model remembering
      // things it has never been told. Clearing here rather than on disconnect means a hung-up
      // conversation stays readable until the next one starts.
      messageExtractor.reset();
      resetChat();
      // The debug mirror of `session.history` belongs to one session too. `connect()` already
      // emitted an empty history, but only the app knows that emptiness meant "new session"
      // rather than "the transcript was retracted", so the epoch is stamped here.
      resetSdkHistory();
      sendMessage('Please greet the user by name and introduce yourself briefly.');
    },
    onDisconnect: () => {
      // Ends the session's turn bookkeeping: the half-spoken reply is finalised as heard instead
      // of being stranded in `activeMessage` behind a permanent typing indicator, and the sealed
      // item / user turn maps stop growing for the lifetime of the tab.
      messageExtractor.reset();
    },
    // Two independent consumers of the same event, guarded independently and in that order of
    // importance. The debug renderer runs first and is the one that could plausibly throw (24
    // per-event renderers reaching into loosely typed payloads); the extractor behind it owns the
    // transcript. One `try` around both would let a cosmetic renderer bug silently starve the
    // conversation the user is actually reading, so each gets its own.
    onTransportEvent: (te) => {
      try {
        processEvent(te, addEvent, eventsLogLevel);
      } catch (error) {
        console.error('failed to render transport event for the debug panel', te, error);
      }
      try {
        messageExtractor.processEvent(te);
      } catch (error) {
        console.error('failed to extract messages from transport event', te, error);
      }
    },
    // Debug only, and a strict dead end: the SDK's history is mirrored into the store for the
    // Events panel to display and is never read back into the transcript or the extractor.
    onHistoryUpdated: setSdkHistory,
  });

  const specActionHandler = useMemo(() => createSpecActionHandler(sendMessage), [sendMessage]);
  // The transcript stays on screen after a disconnect (`reset()` runs on *connect*), so its chips
  // stay clickable long after there is anything to send them to. Dropping the handler makes them
  // inert rather than letting them fire into a closed session.
  const handleSpecAction = isConnected ? specActionHandler : undefined;

  return (
    <main className="flex h-screen w-full flex-col gap-4 overflow-hidden px-4 py-4 lg:px-8">
      {/* Pre create audio component for fast first response */}
      <audio ref={audioRef} autoPlay />

      <section className="shrink-0 rounded-md border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="my-2 text-lg font-bold">Pulse: JSON Rendering Playground</h1>
            <h2>Modular generic components rendered from JSON specs.</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <SettingsPanel />
              <ConnectButton
                isLoading={isLoading}
                isConnected={isConnected}
                onClick={toggleConnect}
              />
            </div>
            {error && (
              <p role="alert" className="text-destructive max-w-sm text-right text-sm">
                {error.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <section className="min-h-0 overflow-auto rounded-md border px-6 py-4 lg:flex-10">
          <MessageList onSpecAction={handleSpecAction} />
        </section>
        <EventsPanel isConnected={isConnected} />
      </div>
    </main>
  );
};

export default RealTimeExperience;
