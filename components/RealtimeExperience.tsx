'use client';

import EventList from '@/components/Events/EventList';
import ConnectButton from '@/components/ConnectButton';
import { useRef } from 'react';
import { useSession, useCustomerContext, useChatStore } from '@/hooks';
import SettingsPanel from '@/components/SettingsPanel';

import { processEvent } from '@/lib/EventProcessor';

const RealTimeExperience = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const context = useCustomerContext();
  const addEvent = useChatStore((state) => state.addEvent);
  const addFinalisedMessage = useChatStore((state) => state.addFinalisedMessage);
  const eventsLogLevel = useChatStore((state) => state.eventsLogLevel);
  const { isLoading, isConnected, toggleConnect, sendMessage } = useSession({
    audioRef,
    context,

    /** Event Handlers */
    onConnect: () => {
      sendMessage('Please greet the user by name and introduce yourself briefly.');
    },
    onTransportEvent: (te) => {
      processEvent(te, addFinalisedMessage, addEvent, eventsLogLevel);
    },
  });

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
          <div className="flex items-center gap-2">
            <SettingsPanel />
            <ConnectButton
              isLoading={isLoading}
              isConnected={isConnected}
              onClick={toggleConnect}
            />
          </div>
        </div>
      </section>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <section className="min-h-0 overflow-auto rounded-md border px-6 py-4 lg:flex-10">
          Chat UI will come here
        </section>
        <EventList />
      </div>
    </main>
  );
};

export default RealTimeExperience;
