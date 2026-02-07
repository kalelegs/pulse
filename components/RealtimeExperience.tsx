'use client';

import useSession from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { RiLinkUnlinkM, RiLoader4Line, RiPlugLine } from '@remixicon/react';
import { useEffect, useRef } from 'react';

const RealTimeExperience = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { session, isLoading, isConnected, toggle } = useSession({
    audioRef,
  });

  useEffect(() => {
    console.log('session changed');
    session?.sendMessage(
      'Say hello to Gaurav and mention that you can assist with their shopping needs.',
    );
  }, [session]);

  return (
    <main className="flex w-full flex-col gap-8 px-4 pt-4 lg:gap-12 lg:px-12">
      {/* Hidden audio element — mounted early so the browser's audio pipeline
          is ready by the time the WebRTC transport starts streaming. */}
      <audio ref={audioRef} autoPlay />

      <section className="rounded-md border px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="my-2 text-lg font-bold">Pulse: Realtime AI Assistant</h1>
            <h2>This project is a reference implementation of realtime AI assistant should be</h2>
          </div>
          <Button onClick={toggle} disabled={isLoading}>
            {isLoading ? (
              <>
                <RiLoader4Line data-icon="inline-start" className="size-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : isConnected ? (
              <>
                <RiLinkUnlinkM data-icon="inline-start" className="size-4" />
                <span>Disconnect</span>
              </>
            ) : (
              <>
                <RiPlugLine data-icon="inline-start" className="size-4" />
                <span>Connect</span>
              </>
            )}
          </Button>
        </div>
      </section>
      <div className="flex flex-col gap-6 lg:flex-row">
        <section className="rounded-md border px-8 py-4 lg:flex-10">Content</section>
        <section className="hidden rounded-md border px-8 py-4 lg:flex lg:flex-2 lg:flex-col">
          <div>Context JSON</div>
          <div>Debug</div>
        </section>
      </div>
    </main>
  );
};

export default RealTimeExperience;
