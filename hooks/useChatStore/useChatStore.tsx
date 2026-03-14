import { create } from 'zustand';
import { TChatStore } from '@/types/ChatStore';
import { TRenderedEvent } from '@/components/Events/renderers/types';

export const useChatStore = create<TChatStore>((set) => ({
  finalisedMessages: [],
  activeMessage: undefined,
  events: [],
  renderToolCalls: true,
  eventsLogLevel: 'verbose',
  addFinalisedMessage: (message) =>
    set((state) => ({
      finalisedMessages: [...state.finalisedMessages, message],
    })),
  setActiveMessage: (message) =>
    set((_) => ({
      activeMessage: message,
    })),
  appendContentToActiveMessage: (content: string) =>
    set((state) => ({
      activeMessage: state.activeMessage
        ? { ...state.activeMessage, content: state.activeMessage.content + content }
        : undefined,
    })),
  addEvent: (event: TRenderedEvent) => set((state) => ({ events: [...state.events, event] })),
  clearEvents: () =>
    set(() => ({
      events: [],
    })),
  setRenderToolCalls: (value: boolean) =>
    set(() => ({
      renderToolCalls: value,
    })),
  setEventsLogLevel: (value) =>
    set(() => ({
      eventsLogLevel: value,
    })),
}));
