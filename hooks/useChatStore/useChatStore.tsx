'use client';

import { create } from 'zustand';
import { TChatStore, TMessage, TMessageSink } from '@/types/ChatStore';
import { DEFAULT_HIDDEN_CATEGORIES } from '@/components/Events/categories';
import { TRenderedEvent } from '@/components/Events/renderers/types';
import type { TJsonRenderSpec } from '@/lib/json-render/types';

/**
 * How many rendered transport events the debug log keeps.
 *
 * `events` is the one collection nothing ever empties on its own: `reset()` deliberately leaves it
 * alone so a reconnect does not wipe the log you are reading, and `clearEvents()` only runs when
 * the Clear button is pressed. At the default `verbose` level a turn records ~90 events, each
 * holding its full `rawEvent` and later a cached search haystack, so an untouched tab accumulated
 * across sessions without limit. 2000 is roughly ten long sessions — far beyond what anyone
 * scrolls back through, and still inside the ~35 ms full re-filter measured at 920 events
 * (`components/Events/README.md`).
 */
export const EVENT_LOG_LIMIT = 2000;

/** Replaces the message with `message.id`, or appends it when the list does not hold it yet. */
const upsertById = (messages: TMessage[], message: TMessage): TMessage[] => {
  const index = messages.findIndex((candidate) => candidate.id === message.id);
  if (index === -1) {
    return [...messages, message];
  }
  const next = [...messages];
  next[index] = message;
  return next;
};

/** Returns `message` with the spec swapped in, or `message` itself when the id does not match. */
const withSpec = (message: TMessage, spec: TJsonRenderSpec | null, messageId?: string) => {
  if (messageId && message.id !== messageId) {
    return message;
  }
  return { ...message, spec };
};

/** Warns when a spec was handed to the store but had nowhere to land. */
const warnUnattachedSpec = (state: TChatStore, messageId?: string) => {
  if (messageId) {
    const exists =
      state.activeMessage?.id === messageId ||
      state.finalisedMessages.some((message) => message.id === messageId);
    if (!exists) {
      console.warn('[chat] attachSpecToMessage: no message with id', messageId);
    }
    return;
  }
  if (!state.activeMessage) {
    console.warn(
      '[chat] attachSpecToMessage: no message is streaming, so the spec was dropped. Pass an explicit message id.',
    );
  }
};

export const useChatStore = create<TChatStore>((set) => ({
  finalisedMessages: [],
  activeMessage: undefined,
  sessionEpoch: 0,
  responseId: undefined,
  events: [],
  sdkHistory: [],
  sdkHistoryUpdates: 0,
  renderToolCalls: true,
  eventsLogLevel: 'verbose',
  hiddenEventCategories: [...DEFAULT_HIDDEN_CATEGORIES],
  setResponseId: (responseId) =>
    set(() => ({
      responseId,
    })),
  upsertFinalisedMessage: (message) =>
    set((state) => ({
      finalisedMessages: upsertById(state.finalisedMessages, message),
    })),
  removeFinalisedMessage: (messageId: string) =>
    set((state) => ({
      finalisedMessages: state.finalisedMessages.filter((message) => message.id !== messageId),
    })),
  setActiveMessage: (message) =>
    set(() => ({
      activeMessage: message,
    })),
  appendContentToActiveMessage: (content: string) =>
    set((state) => ({
      activeMessage: state.activeMessage
        ? { ...state.activeMessage, content: state.activeMessage.content + content }
        : undefined,
    })),
  attachSpecToMessage: (spec, messageId) =>
    set((state) => {
      warnUnattachedSpec(state, messageId);
      const activeMessage = state.activeMessage
        ? withSpec(state.activeMessage, spec, messageId)
        : undefined;
      // Without an id the spec belongs to the message being spoken right now, so the finalised
      // list is left untouched.
      const finalisedMessages = messageId
        ? state.finalisedMessages.map((message) => withSpec(message, spec, messageId))
        : state.finalisedMessages;
      return { activeMessage, finalisedMessages };
    }),
  reset: () =>
    set((state) => ({
      finalisedMessages: [],
      activeMessage: undefined,
      responseId: undefined,
      // Bumped in the same `set` as the emptying, so a subscriber sees "empty *and* a new epoch"
      // in one notification and can never mistake a mid-session retraction for a new session.
      sessionEpoch: state.sessionEpoch + 1,
    })),
  // Ring buffer: the newest `EVENT_LOG_LIMIT` events, oldest dropped from the head. The panel
  // reads the log newest-last, so trimming the front is the end nobody is looking at.
  addEvent: (event: TRenderedEvent) =>
    set((state) => {
      const events = [...state.events, event];
      return { events: events.length > EVENT_LOG_LIMIT ? events.slice(-EVENT_LOG_LIMIT) : events };
    }),
  clearEvents: () =>
    set(() => ({
      events: [],
    })),
  // Read-only debug mirror of the SDK's history. It is written from `history_updated` and read by
  // the Events panel, and by nothing else — no message ever comes out of here.
  setSdkHistory: (history) =>
    set((state) => ({
      sdkHistory: history,
      sdkHistoryUpdates: state.sdkHistoryUpdates + 1,
    })),
  resetSdkHistory: () =>
    set(() => ({
      sdkHistory: [],
      sdkHistoryUpdates: 0,
    })),
  setRenderToolCalls: (value: boolean) =>
    set(() => ({
      renderToolCalls: value,
    })),
  setEventsLogLevel: (value) =>
    set(() => ({
      eventsLogLevel: value,
    })),
  // Whole-array writes keep the store dumb: toggle, solo and reset are all "here is the new set"
  // and are worked out by the filter bar, which already holds the current one.
  setHiddenEventCategories: (values) =>
    set(() => ({
      hiddenEventCategories: values,
    })),
}));

/**
 * The chat store viewed as a message sink, for consumers that live outside React (the transport
 * message extractor). Every call reads the live store, so this object is safe to keep forever.
 */
export const chatMessageSink: TMessageSink = {
  getActiveMessage: () => useChatStore.getState().activeMessage,
  setActiveMessage: (message) => useChatStore.getState().setActiveMessage(message),
  appendContentToActiveMessage: (content) =>
    useChatStore.getState().appendContentToActiveMessage(content),
  upsertFinalisedMessage: (message) => useChatStore.getState().upsertFinalisedMessage(message),
  getFinalisedMessage: (messageId) =>
    useChatStore.getState().finalisedMessages.find((message) => message.id === messageId),
  removeFinalisedMessage: (messageId) => useChatStore.getState().removeFinalisedMessage(messageId),
  setResponseId: (responseId) => useChatStore.getState().setResponseId(responseId),
};
