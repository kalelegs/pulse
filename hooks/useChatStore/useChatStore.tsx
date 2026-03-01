import { create } from 'zustand';
import { TChatStore } from '@/types/ChatStore';
import { TRenderedEvent } from '@/components/Events/renderers/types';

export const useChatStore = create<TChatStore>((set) => ({
  messages: [],
  events: [],
  renderToolCalls: true,
  eventsLogLevel: 'verbose',
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
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
