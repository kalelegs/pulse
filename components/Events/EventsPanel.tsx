'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import EventList from './EventList';
import HistoryPanel from './HistoryPanel';

/** The two views the debug column can show. */
enum EDebugView {
  Events = 'events',
  History = 'history',
}

const VIEWS: readonly { id: EDebugView; label: string; hint: string }[] = [
  {
    id: EDebugView.Events,
    label: 'Events',
    hint: 'Every transport event, as recorded by lib/events/logTransportEvent.',
  },
  {
    id: EDebugView.History,
    label: 'SDK history',
    hint: "The SDK's own server-side conversation record. Read-only cross-check for the transcript.",
  },
];

type TEventsPanelProps = {
  /** Live session state, needed only to explain an empty or stale history. */
  isConnected: boolean;
};

/**
 * The debug column: the event log and the SDK's history, side by side as tabs.
 *
 * They are tabs rather than one merged list because they are answers to different questions — the
 * log says what the transport sent, the history says what the server believes was said — and
 * interleaving them would suggest they share a timeline. They do not: history is always later.
 */
const EventsPanel = ({ isConnected }: TEventsPanelProps) => {
  const [view, setView] = useState<EDebugView>(EDebugView.Events);

  return (
    <section className="bg-card flex min-h-0 flex-col overflow-hidden rounded-md border lg:flex-4">
      <div role="tablist" aria-label="Debug views" className="flex gap-1 border-b px-4 py-2">
        {VIEWS.map((candidate) => (
          <Button
            key={candidate.id}
            type="button"
            role="tab"
            size="xs"
            variant={view === candidate.id ? 'secondary' : 'ghost'}
            aria-selected={view === candidate.id}
            title={candidate.hint}
            className="font-normal"
            onClick={() => setView(candidate.id)}
          >
            {candidate.label}
          </Button>
        ))}
      </div>
      {view === EDebugView.Events ? <EventList /> : <HistoryPanel isConnected={isConnected} />}
    </section>
  );
};

export default EventsPanel;
