import type { TMessage } from './ChatStore';

/** Adds a message, or replaces the message that already carries the same id. */
export type TUpsertMessageFn = (message: TMessage) => void;
/** Drops the finalised message with this id. A no-op when nothing carries it. */
export type TRemoveMessageFn = (messageId: string) => void;
/** Reads a finalised message back, so a late correction can be upserted onto it. */
export type TReadMessageFn = (messageId: string) => TMessage | undefined;
/** Passing `undefined` clears the in-flight message without finalising it. */
export type TSetMessageFn = (message: TMessage | undefined) => void;
export type TAppendMessageContentFn = (content: string) => void;
/** `undefined` between responses, and after a reset. */
export type TSetResponseIdFn = (responseId: string | undefined) => void;

/**
 * The narrow slice of the chat store that the transport message extractor writes through.
 * Keeping it separate from `TChatStore` means the extractor never sees the store's React-facing
 * surface (`sessionEpoch`, `attachSpecToMessage`, `reset`) and can be driven by any other
 * implementation.
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
