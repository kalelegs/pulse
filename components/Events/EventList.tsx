'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EventCard from './EventCard';
import { useChatStore } from '@/hooks';
import { TRenderedEvent } from './renderers/types';
import { TEventsLogLevel } from '@/types/ChatStore';

const INFO_ONLY_EVENT_TYPES = new Set<string>([
  'conversation.item.input_audio_transcription.delta',
  'response.function_call_arguments.delta',
  'response.output_audio_transcript.delta',
]);
const SEARCH_DEBOUNCE_MS = 500;

const isToolCallEvent = (event: TRenderedEvent) => {
  const type = event.rawEvent.type;
  const itemType = (event.rawEvent as { item?: { type?: string } }).item?.type;

  return (
    type === 'response.function_call_arguments.delta' ||
    type === 'response.function_call_arguments.done' ||
    itemType === 'function_call' ||
    itemType === 'function_call_output'
  );
};

const shouldRenderEvent = (
  event: TRenderedEvent,
  renderToolCalls: boolean,
  eventsLogLevel: TEventsLogLevel,
) => {
  if (!renderToolCalls && isToolCallEvent(event)) {
    return false;
  }

  if (eventsLogLevel === 'info' && INFO_ONLY_EVENT_TYPES.has(event.rawEvent.type)) {
    return false;
  }

  return true;
};

const matchesEventSearch = (event: TRenderedEvent, searchQuery: string) => {
  if (!searchQuery) {
    return true;
  }

  const normalizedQuery = searchQuery.toLowerCase();
  const searchableText =
    `${event.kind} ${event.title} ${event.summary} ${JSON.stringify(event.rawEvent)}`.toLowerCase();
  return searchableText.includes(normalizedQuery);
};

const EventList = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const events = useChatStore((state) => state.events);
  const renderToolCalls = useChatStore((state) => state.renderToolCalls);
  const eventsLogLevel = useChatStore((state) => state.eventsLogLevel);
  const clearEvents = useChatStore((state) => state.clearEvents);
  const visibleEvents = events.filter((event) =>
    shouldRenderEvent(event, renderToolCalls, eventsLogLevel),
  );
  const filteredEvents = visibleEvents.filter((event) => matchesEventSearch(event, searchQuery));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInputValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      // get's called when the component unmounts or when searchInputValue changes
      window.clearTimeout(timeoutId);
    };
  }, [searchInputValue]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [filteredEvents.length]);

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
            <span className="text-muted-foreground text-xs">
              {filteredEvents.length}/{visibleEvents.length}
            </span>
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
        <div className="mt-3">
          <Input
            type="search"
            value={searchInputValue}
            onChange={(event) => setSearchInputValue(event.target.value)}
            placeholder="Search events..."
            className="h-8 text-xs"
          />
        </div>
      </div>
      <div
        ref={listRef}
        className="bg-muted/20 flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4"
      >
        {filteredEvents.length === 0 ? (
          <p className="text-muted-foreground p-2 text-xs">
            {searchQuery.trim()
              ? 'No events match your search.'
              : 'Waiting for transport events...'}
          </p>
        ) : (
          filteredEvents.map((event) => (
            <EventCard
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

export default EventList;
