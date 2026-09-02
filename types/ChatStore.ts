import type { TJsonRenderSpec } from '@/lib/json-render/types';
import type {
  TAppendMessageContentFn,
  TRemoveMessageFn,
  TSetMessageFn,
  TSetResponseIdFn,
  TUpsertMessageFn,
} from './MessageSink';

/** Each field is milliseconds since the turn started; see `lib/EventProcessor/turnClock`. */
export type TDuration = {
  textStart: number;
  textEnd: number;
  audioStart: number;
  audioEnd: number;
};

/** The two things a user bubble can still be waiting on. */
export type TUserTurnStage = 'listening' | 'transcribing';

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
   * Set while more content is still expected for this message; `undefined` once it has resolved.
   *
   * Only user turns set it. An assistant turn is streamed through `activeMessage` and is finalised
   * exactly once, so "still arriving" is already visible from *where* the message lives. A user
   * turn has no such place: it is written into `finalisedMessages` as soon as the user starts
   * talking to hold its position in turn order, then filled in by transcription deltas afterwards.
   * The stage is what the bubble renders its cue from: `listening` is speech still being captured,
   * `transcribing` is a committed buffer whose transcript has not finished arriving.
   */
  pending?: TUserTurnStage;
};

export type TAttachSpecFn = (spec: TJsonRenderSpec | null, messageId?: string) => void;

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
   * keeping the previous transcript on screen would imply context the model does not have. The
   * debug panel's state lives in `useEventLogStore` and is reset separately.
   */
  reset: () => void;
};
