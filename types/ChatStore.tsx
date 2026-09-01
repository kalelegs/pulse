// `import type` on both, deliberately: they close a cycle. See `components/Events/categories.ts`.
import type { EEventCategory } from '@/components/Events/categories';
import type { TRenderedEvent } from '@/components/Events/renderers/types';
import type { TJsonRenderSpec } from '@/lib/json-render/types';
import type { RealtimeItem } from '@openai/agents/realtime';

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
  /** Stable identity of the message. Always the transport `item_id` of the conversation item. */
  id: string;
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

  /** Optional generative-UI spec rendered in place of / alongside the text body. */
  spec?: TJsonRenderSpec | null;

  /**
   * True while more content is still expected for this message.
   *
   * Only user turns set it. An assistant turn is streamed through `activeMessage` and is finalised
   * exactly once, so "still arriving" is already visible from *where* the message lives. A user
   * turn has no such place: it is written into `finalisedMessages` on
   * `input_audio_buffer.committed` to hold its position in turn order, then filled in by
   * transcription deltas afterwards — so the flag is what tells a half-transcribed bubble from a
   * finished one.
   */
  isPending?: boolean;
};

export type TAddEventFn = (ev: TRenderedEvent) => void;
/** Adds a message, or replaces the message that already carries the same id. */
export type TUpsertMessageFn = (message: TMessage) => void;
/** Drops the finalised message with this id. A no-op when nothing carries it. */
export type TRemoveMessageFn = (messageId: string) => void;
/** Reads a finalised message back, so a late correction can be upserted onto it. */
export type TReadMessageFn = (messageId: string) => TMessage | undefined;
/** Passing `undefined` clears the in-flight message without finalising it. */
export type TSetMessageFn = (message: TMessage | undefined) => void;
export type TAppendMessageContentFn = (content: string) => void;
export type TAttachSpecFn = (spec: TJsonRenderSpec | null, messageId?: string) => void;
/** `undefined` between responses, and after a reset. */
export type TSetResponseIdFn = (responseId: string | undefined) => void;
export type TEventsLogLevel = 'verbose' | 'info';

/**
 * The narrow slice of the chat store that the transport message extractor writes through.
 * Keeping it separate from `TChatStore` means the extractor never sees event/debug state and can
 * be driven by any other implementation.
 */
export type TMessageSink = {
  /** Reads the message that is currently streaming, including any spec attached to it. */
  getActiveMessage: () => TMessage | undefined;
  setActiveMessage: TSetMessageFn;
  appendContentToActiveMessage: TAppendMessageContentFn;
  upsertFinalisedMessage: TUpsertMessageFn;
  /**
   * Reads a message back out of the transcript. Needed because some corrections land *after*
   * finalisation: audio playback stops after the transcript is done, and a barge-in that the
   * server did not actually cancel keeps producing text for an already-written bubble.
   */
  getFinalisedMessage: TReadMessageFn;
  /** Removes a reserved slot that turned out to hold nothing (silence, a cough, a slammed door). */
  removeFinalisedMessage: TRemoveMessageFn;
  /**
   * Publishes the response every assistant item from now on belongs to, read from
   * `response.created`. Consumers outside the extractor (`tools/attachSpec`) need it to tell "the
   * bubble I am waiting for" from "another bubble of the response I was called from".
   */
  setResponseId: TSetResponseIdFn;
};

export type TChatStore = {
  /** Completely received messages  */
  finalisedMessages: TMessage[];
  /** Message that is still streaming */
  activeMessage: TMessage | undefined;
  /**
   * Counts the sessions this store has served, incremented by `reset()`.
   *
   * The honest "the session changed" signal. Work that outlives a single event — a tool waiting
   * for the bubble its card belongs to — captures this when it starts and gives up as soon as it
   * moves, rather than inferring the change from a transcript that happens to be empty. A user
   * slot can be retracted (a cough, a slammed door) down to an empty transcript *without* the
   * session ending, so emptiness proves nothing.
   */
  sessionEpoch: number;
  /**
   * Id of the response currently producing assistant items, or `undefined` between responses.
   *
   * One `response.created` … `response.done` span is the unit the transport groups items by, so
   * this is what tells two bubbles of the same response apart from the bubble of the *next* one.
   */
  responseId: string | undefined;
  setResponseId: TSetResponseIdFn;
  /**
   * Adds a finalised message, or replaces the one already stored under the same id in place.
   *
   * Replacing in place keeps the transcript in the order the turns actually happened: a user turn
   * reserves its slot as soon as its audio buffer is committed and is filled in later, once the
   * (asynchronous) input transcription arrives — typically after the assistant has already started
   * replying. Hence no plain "append" sibling: it would print such a turn twice, out of order.
   */
  upsertFinalisedMessage: TUpsertMessageFn;
  /** Drops a finalised message. Used to retract a user slot that never received a transcript. */
  removeFinalisedMessage: TRemoveMessageFn;
  setActiveMessage: TSetMessageFn;
  /**
   * Appends content to existing message
   * Initial message has to be set before calling this function
   * Otherwise it will just ignore
   */
  appendContentToActiveMessage: TAppendMessageContentFn;
  /**
   * Attaches (or replaces) a generative-UI spec on a message.
   *
   * Pass `messageId` to target a specific message. Omit it to target `activeMessage` — the
   * "here is a spec for the message being spoken right now" entry point, which is how an agent
   * tool emitting a spec mid-turn reaches the message it belongs to. Passing `null` clears the
   * spec. Unknown ids (or no active message) are a no-op, and warn.
   */
  attachSpecToMessage: TAttachSpecFn;
  /**
   * Empties the transcript (`finalisedMessages` and `activeMessage`) and starts a new
   * `sessionEpoch`.
   *
   * Called when a new session starts: a realtime session begins with no server-side history, so
   * keeping the previous transcript on screen would imply context the model does not have.
   * Debug state (`events`) and settings are deliberately left alone.
   */
  reset: () => void;
  /** Rendered transport log: a ring buffer of the newest `EVENT_LOG_LIMIT` (`useChatStore`). */
  events: TRenderedEvent[];
  addEvent: TAddEventFn;
  clearEvents: () => void;
  /**
   * Categories the Events panel currently hides. Display-only: hidden events stay in `events`, so
   * switching a category back on reveals the history rather than starting from empty.
   *
   * Lives in the store rather than in the panel so the choice survives the panel unmounting, and
   * it is deliberately untouched by `reset()` — reconnecting should not undo the user's filters.
   */
  hiddenEventCategories: EEventCategory[];
  setHiddenEventCategories: (values: EEventCategory[]) => void;
  renderToolCalls: boolean;
  setRenderToolCalls: (value: boolean) => void;
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
