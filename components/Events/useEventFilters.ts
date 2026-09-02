'use client';

import { useMemo } from 'react';
import { getEventCategory, isToolCallEvent } from '@/lib/events/categories';
import { EEventCategory, TRenderedEvent } from '@/types';

/**
 * Lowercased searchable text per event, built once and kept for as long as the event object is
 * alive. `JSON.stringify` over every raw event on every keystroke is the one genuinely expensive
 * part of filtering, and rendered events are immutable, so caching on identity is safe.
 */
const searchHaystacks = new WeakMap<TRenderedEvent, string>();

const haystackFor = (event: TRenderedEvent) => {
  const cached = searchHaystacks.get(event);
  if (cached !== undefined) {
    return cached;
  }
  const haystack =
    `${event.kind} ${event.title} ${event.summary} ${JSON.stringify(event.rawEvent)}`.toLowerCase();
  searchHaystacks.set(event, haystack);
  return haystack;
};

const emptyCounts = (): Record<EEventCategory, number> => {
  const counts = {} as Record<EEventCategory, number>;
  for (const category of Object.values(EEventCategory)) {
    counts[category] = 0;
  }
  return counts;
};

export type TEventFilterInput = {
  events: TRenderedEvent[];
  hiddenCategories: EEventCategory[];
  renderToolCalls: boolean;
  searchQuery: string;
};

export type TEventFilters = {
  /** What the list renders. */
  visibleEvents: TRenderedEvent[];
  /** Per-category tallies over the candidate set, so a chip shows what turning it on would add. */
  countsByCategory: Record<EEventCategory, number>;
  /** Candidates the category chips are currently holding back. */
  hiddenByCategoryCount: number;
  /** Events dropped by the Settings-level "render tool calls" switch, for the empty state. */
  hiddenByToolFilterCount: number;
};

/**
 * Applies the display filters to the recorded event log.
 *
 * Purely a view over the store: nothing here removes an event, so flipping a category back on
 * reveals the history that was there all along. One memoised pass produces the visible list and
 * every chip count together, so no row recomputes anything while rendering.
 */
export const useEventFilters = ({
  events,
  hiddenCategories,
  renderToolCalls,
  searchQuery,
}: TEventFilterInput): TEventFilters => {
  return useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const hidden = new Set(hiddenCategories);
    const countsByCategory = emptyCounts();
    const visibleEvents: TRenderedEvent[] = [];
    // Events passing every filter *except* the category chips — what the chip counts are taken
    // over, and the base `hiddenByCategoryCount` is derived from. Local: nothing outside needs it.
    let candidateCount = 0;
    let hiddenByToolFilterCount = 0;

    for (const event of events) {
      if (!renderToolCalls && isToolCallEvent(event)) {
        hiddenByToolFilterCount += 1;
        continue;
      }
      if (normalizedQuery && !haystackFor(event).includes(normalizedQuery)) {
        continue;
      }
      candidateCount += 1;
      const category = getEventCategory(event);
      countsByCategory[category] += 1;
      if (!hidden.has(category)) {
        visibleEvents.push(event);
      }
    }

    return {
      visibleEvents,
      countsByCategory,
      hiddenByCategoryCount: candidateCount - visibleEvents.length,
      hiddenByToolFilterCount,
    };
  }, [events, hiddenCategories, renderToolCalls, searchQuery]);
};
