'use client';

import ConnectButton from '@/components/ConnectButton';
import { JSONUIProvider, Renderer } from '@json-render/react';
import { useMemo, useRef } from 'react';
import { jsonRenderRegistry } from '@/lib/jsonRender';
import { createShowcaseSpec } from '@/lib/spec-builders/showcase';
import { useSession } from '@/hooks/useSession';

const RealTimeExperience = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isLoading, isConnected, toggleConnect } = useSession({
    audioRef,
  });

  const showcaseSpec = useMemo(() => createShowcaseSpec(), []);

  return (
    <main className="flex w-full flex-col gap-8 px-4 pt-4 lg:gap-12 lg:px-12">
      <audio ref={audioRef} autoPlay />

      <section className="rounded-md border px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="my-2 text-lg font-bold">Pulse: JSON Rendering Playground</h1>
            <h2>Modular generic components rendered from JSON specs.</h2>
          </div>
          <div className="flex gap-2">
            <ConnectButton
              isLoading={isLoading}
              isConnected={isConnected}
              onClick={toggleConnect}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row">
        <section className="rounded-md border px-6 py-4 lg:flex-10">
          <JSONUIProvider registry={jsonRenderRegistry}>
            <Renderer registry={jsonRenderRegistry} spec={showcaseSpec} />
          </JSONUIProvider>
        </section>
        <section className="rounded-md border px-6 py-4 lg:flex-4">
          <h3 className="text-sm font-semibold">Realtime Events</h3>
          <pre className="bg-muted mt-2 max-h-96 overflow-auto rounded-md p-3 text-xs">
            Events will come here
          </pre>
        </section>
      </div>
    </main>
  );
};

export default RealTimeExperience;
