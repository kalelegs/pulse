'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import LogCard from './LogCard';
import { useChatStore } from '@/hooks';
import { TRenderedEvent } from './renderers/types';

const AgentLogs = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const events = useChatStore((state) => state.events);
  const clearEvents = useChatStore((state) => state.clearEvents);

  useEffect(() => {
    const container = listRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [events.length]);

  const onCopy = async (event: TRenderedEvent) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event.rawEvent, null, 2));
      setCopiedId(event.id);
      setTimeout(() => setCopiedId((value) => (value === event.id ? null : value)), 1200);
    } catch (error) {
      console.error('Failed to copy event to clipboard.', error);
    }
  };

  const onClearEvents = () => {
    setCopiedId(null);
    setExpandedIds([]);
    clearEvents();
  };

  return (
    <section className="bg-card flex min-h-0 flex-col overflow-hidden rounded-md border lg:flex-4">
      <div className="border-b px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Realtime Events</h3>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">{events.length} events</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onClearEvents}
              disabled={events.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
      <div
        ref={listRef}
        className="bg-muted/20 flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4"
      >
        {events.length === 0 ? (
          <p className="text-muted-foreground p-2 text-xs">Waiting for transport events...</p>
        ) : (
          events.map((event) => (
            <LogCard
              key={event.id}
              incomingEvent={event}
              copied={copiedId === event.id}
              expanded={expandedIds.includes(event.id)}
              onToggleExpand={() => {
                setExpandedIds((currentIds) =>
                  currentIds.includes(event.id)
                    ? currentIds.filter((id) => id !== event.id)
                    : [...currentIds, event.id],
                );
              }}
              onCopy={() => void onCopy(event)}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default AgentLogs;
