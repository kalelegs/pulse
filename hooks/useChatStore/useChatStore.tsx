import { create } from 'zustand';
import { TChatStore } from '@/types/ChatStore';
import { TRenderedEvent } from '@/components/AgentLogs/renderers/types';

export const useChatStore = create<TChatStore>((set) => ({
  messages: [],
  events: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  addEvent: (event: TRenderedEvent) => set((state) => ({ events: [...state.events, event] })),
  clearEvents: () =>
    set(() => ({
      events: [],
    })),
}));
