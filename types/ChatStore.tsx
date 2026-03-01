import { TRenderedEvent } from '@/components/Events/renderers/types';

export type TDuration = {
  /**
   * Time taken for text to start flowing. this is start of text streaming
   */
  textStart: number;
  /**
   * Time taken for text to finish flowing. this is end of text streaming
   */
  textEnd: number;
  /**
   * Time taken for audio to start playing
   */
  audioStart: number;
  /**
   * Time taken for audio to finish playing
   * either audio finished or interrupted
   */
  audioEnd: number;
};

export type TMessage = {
  role: 'user' | 'assistant';
  mime: 'text/plain' | 'image/png';
  /**
   * Image is represented as base64
   * Audio is never represented here. These are messages that can be rendered on screen
   */
  content: string;

  /**
   * Duration numbers
   * For assistant response it represents time to respond
   * For user messages it represents transcription times roughly
   */
  duration: TDuration;
};

export type TAddEventFn = (ev: TRenderedEvent) => void;
export type TAddMessageFn = (message: TMessage) => void;
export type TEventsLogLevel = 'verbose' | 'info';
export type TChatStore = {
  messages: TMessage[];
  addMessage: TAddMessageFn;
  events: TRenderedEvent[];
  addEvent: TAddEventFn;
  clearEvents: () => void;
  renderToolCalls: boolean;
  setRenderToolCalls: (value: boolean) => void;
  eventsLogLevel: TEventsLogLevel;
  setEventsLogLevel: (value: TEventsLogLevel) => void;
};
