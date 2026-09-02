'use client';

import { create } from 'zustand';
import { TChatStore, TMessage, TMessageSink } from '@/types';
import type { TJsonRenderSpec } from '@/lib/json-render/types';

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
