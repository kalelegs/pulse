'use client';

import { create } from 'zustand';
import { EEventCategory, TEventLogStore } from '@/types';

/** Ring-buffer cap on `events`. Why 2000: `components/Events/README.md`, "Recorded vs displayed". */
export const EVENT_LOG_LIMIT = 2000;

/**
 * State the debug panel owns: the rendered transport log, its display settings, and the
 * read-only mirror of the SDK's history. Nothing here is touched by the transcript store's
 * `reset()`, so a reconnect neither wipes the log you are reading nor undoes your filters.
 */
export const useEventLogStore = create<TEventLogStore>((set) => ({
  events: [],
  // Only deltas start hidden: a captured session logged 126 delta events against 58 of everything
  // else, so hiding them collapses a turn to a readable handful without losing a boundary.
  hiddenEventCategories: [EEventCategory.Delta],
  renderToolCalls: true,
  eventsLogLevel: 'verbose',
  sdkHistory: [],
  sdkHistoryUpdates: 0,
  // Ring buffer: the newest `EVENT_LOG_LIMIT` events, oldest dropped from the head. The panel
  // reads the log newest-last, so trimming the front is the end nobody is looking at.
  addEvent: (event) =>
    set((state) => {
      const events = [...state.events, event];
      return { events: events.length > EVENT_LOG_LIMIT ? events.slice(-EVENT_LOG_LIMIT) : events };
    }),
  clearEvents: () => set(() => ({ events: [] })),
  // Whole-array writes keep the store dumb: toggle, solo and reset are all "here is the new set"
  // and are worked out by the filter bar, which already holds the current one.
  setHiddenEventCategories: (values) => set(() => ({ hiddenEventCategories: values })),
  setRenderToolCalls: (value) => set(() => ({ renderToolCalls: value })),
  setEventsLogLevel: (value) => set(() => ({ eventsLogLevel: value })),
  // Written from `history_updated`, read by the Events panel, and by nothing else — no message
  // ever comes out of here (`lib/EventProcessor/SdkHistory.md`).
  setSdkHistory: (history) =>
    set((state) => ({
      sdkHistory: history,
      sdkHistoryUpdates: state.sdkHistoryUpdates + 1,
    })),
  resetSdkHistory: () => set(() => ({ sdkHistory: [], sdkHistoryUpdates: 0 })),
}));
