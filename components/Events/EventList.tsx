'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RiArrowDownLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EventCard from './EventCard';
import EventFilterBar from './EventFilterBar';
import EventsEmptyState from './EventsEmptyState';
import { EVENT_LOG_LIMIT, useAutoScroll, useEventLogStore } from '@/hooks';
import { TRenderedEvent } from '@/types';
import { useEventFilters } from './useEventFilters';

const SEARCH_DEBOUNCE_MS = 300;

/** How long a copied row stays flashed. */
const COPY_FLASH_MS = 1200;

/**
 * The transport event log — the `Events` tab of the debug panel (`EventsPanel`).
 *
 * Everything here is display-only. `eventsLogLevel` (Settings) decides what is *recorded* into the
 * store; the chips and the search box decide what is *shown*, and hide nothing permanently — the
 * header count reads "shown / recorded" so the difference stays visible.
 */
const EventList = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [searchInputValue, setSearchInputValue] = useState('');
  // Debounced copy of the input. Kept local rather than in the store: it changes on every
  // keystroke and no other component cares, so putting it in zustand would wake every subscriber.
  const [searchQuery, setSearchQuery] = useState('');
  const copyFlashRef = useRef<number | undefined>(undefined);
  // Same pinned-detection the chat column uses: it discovers its scroller by walking up the DOM,
  // so the only thing this list has to do is hand it the growing element.
  const { listRef, isPinned, scrollToBottom } = useAutoScroll();

  const events = useEventLogStore((state) => state.events);
  const renderToolCalls = useEventLogStore((state) => state.renderToolCalls);
  const clearEvents = useEventLogStore((state) => state.clearEvents);
  const hiddenCategories = useEventLogStore((state) => state.hiddenEventCategories);
  const setHiddenCategories = useEventLogStore((state) => state.setHiddenEventCategories);

  const { visibleEvents, countsByCategory, hiddenByCategoryCount, hiddenByToolFilterCount } =
    useEventFilters({ events, hiddenCategories, renderToolCalls, searchQuery });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInputValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      // get's called when the component unmounts or when searchInputValue changes
      window.clearTimeout(timeoutId);
    };
  }, [searchInputValue]);

  useEffect(
    () => () => {
      window.clearTimeout(copyFlashRef.current);
    },
    [],
  );

  const onCopy = useCallback(async (event: TRenderedEvent) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event.rawEvent, null, 2));
      setCopiedId(event.id);
      window.clearTimeout(copyFlashRef.current);
      copyFlashRef.current = window.setTimeout(
        () => setCopiedId((value) => (value === event.id ? null : value)),
        COPY_FLASH_MS,
      );
    } catch (error) {
      console.error('Failed to copy event to clipboard.', error);
    }
  }, []);

  const onToggleExpand = useCallback((eventId: string) => {
    setExpandedIds((currentIds) =>
      currentIds.includes(eventId)
        ? currentIds.filter((id) => id !== eventId)
        : [...currentIds, eventId],
    );
  }, []);

  const onClearEvents = () => {
    setCopiedId(null);
    setExpandedIds([]);
    clearEvents();
  };

  const onResetFilters = () => {
    setSearchInputValue('');
    setSearchQuery('');
    setHiddenCategories([]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Realtime Events</h3>
          <div className="flex items-center gap-2">
            <span
              className="text-muted-foreground text-xs tabular-nums"
              title={`Shown / retained. Filters never drop a retained event; the log keeps the most recent ${EVENT_LOG_LIMIT}.`}
            >
              {visibleEvents.length}/{events.length}
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
            placeholder="Filter by type, summary or id..."
            className="h-8 text-xs"
          />
        </div>
        <EventFilterBar
          hiddenCategories={hiddenCategories}
          countsByCategory={countsByCategory}
          onChange={setHiddenCategories}
        />
      </div>
      <div className="bg-muted/20 min-h-0 flex-1 overflow-auto p-4">
        <div ref={listRef} className="flex flex-col gap-3">
          {visibleEvents.length === 0 ? (
            <EventsEmptyState
              recordedCount={events.length}
              hiddenCategoryCount={hiddenCategories.length}
              hiddenByCategoryCount={hiddenByCategoryCount}
              hiddenByToolFilterCount={hiddenByToolFilterCount}
              searchQuery={searchQuery}
              onReset={onResetFilters}
            />
          ) : (
            visibleEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                copied={copiedId === event.id}
                expanded={expandedIds.includes(event.id)}
                onToggleExpand={onToggleExpand}
                onCopy={onCopy}
              />
            ))
          )}
          {visibleEvents.length > 0 && !isPinned ? (
            <div className="pointer-events-none sticky bottom-0 flex justify-center pt-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="pointer-events-auto h-7 px-2 text-xs shadow-sm"
                onClick={scrollToBottom}
              >
                <RiArrowDownLine className="size-3.5" aria-hidden="true" />
                Jump to latest
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EventList;
