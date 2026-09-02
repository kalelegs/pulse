import type { RealtimeItem } from '@openai/agents/realtime';
import type { EEventCategory, TRenderedEvent } from './events';

export type TAddEventFn = (event: TRenderedEvent) => void;

/** `verbose` records every known transport event, `info` only the structural ones. */
export type TEventsLogLevel = 'verbose' | 'info';

/**
 * Everything the debug panel (`components/Events`) owns: the rendered transport log, its display
 * settings, and the read-only mirror of the SDK's history. Kept apart from the transcript store so
 * the conversation never depends on debug state.
 */
export type TEventLogStore = {
  /** Rendered transport log: a ring buffer of the newest `EVENT_LOG_LIMIT` (`useEventLogStore`). */
  events: TRenderedEvent[];
  addEvent: TAddEventFn;
  clearEvents: () => void;
  /**
   * Categories the Events panel currently hides. Display-only: hidden events stay in `events`, so
   * switching a category back on reveals the history rather than starting from empty.
   *
   * Lives in the store rather than in the panel so the choice survives the panel unmounting, and
   * no reconnect touches it — reconnecting should not undo the user's filters.
   */
  hiddenEventCategories: EEventCategory[];
  setHiddenEventCategories: (values: EEventCategory[]) => void;
  /** Display filter: when off, `isToolCallEvent` rows are held back from the list. */
  renderToolCalls: boolean;
  setRenderToolCalls: (value: boolean) => void;
  /** Recording gate: decides what `logTransportEvent` writes into `events` in the first place. */
  eventsLogLevel: TEventsLogLevel;
  setEventsLogLevel: (value: TEventsLogLevel) => void;
  /**
   * The SDK's own `session.history`, as last reported by `history_updated`.
   *
   * Debug-only, and deliberately a dead end: the Events panel is the only reader, nothing here
   * reaches the transcript, and it is never written back (`lib/EventProcessor/SdkHistory.md`).
   */
  sdkHistory: RealtimeItem[];
  /**
   * `history_updated` emissions in the current session. Shown beside the item count because
   * history is not a streaming source, so it runs far ahead of the changes you can actually read.
   */
  sdkHistoryUpdates: number;
  /** Replaces the mirror wholesale — the SDK hands over the entire array every time. */
  setSdkHistory: (history: RealtimeItem[]) => void;
  /**
   * Starts a new session's mirror. The SDK's history has no epoch — `connect()` clears it and
   * emits an empty array, which alone is indistinguishable from a retraction down to empty — so
   * the app stamps the boundary rather than making the panel guess.
   */
  resetSdkHistory: () => void;
};
