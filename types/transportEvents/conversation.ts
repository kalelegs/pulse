import type { TEventRecord, TTransportEventBase } from './names';

export type TConversationContentPart = {
  type?: string;
  text?: string;
  transcript?: string;
  [key: string]: unknown;
};

export type TConversationItem = {
  id?: string;
  type?: string;
  role?: string;
  status?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  output?: string;
  content?: TConversationContentPart[];
  [key: string]: unknown;
};

export type TConversationItemAddedEvent = TTransportEventBase & {
  type: 'conversation.item.added';
  item?: TConversationItem;
  previous_item_id?: string | null;
};

export type TConversationItemDoneEvent = TTransportEventBase & {
  type: 'conversation.item.done';
  item?: TConversationItem;
  previous_item_id?: string | null;
};

export type TConversationItemRetrievedEvent = TTransportEventBase & {
  type: 'conversation.item.retrieved';
  item?: TConversationItem;
};

/** The server confirming that an assistant item's audio was cut short by a barge-in. */
export type TConversationItemTruncatedEvent = TTransportEventBase & {
  type: 'conversation.item.truncated';
  item_id?: string;
  content_index?: number;
  /** Where in the audio the user interrupted, in milliseconds. */
  audio_end_ms?: number;
};

export type TConversationInputAudioTranscriptionDeltaEvent = TTransportEventBase & {
  type: 'conversation.item.input_audio_transcription.delta';
  item_id?: string;
  content_index?: number;
  delta?: string;
};

export type TConversationInputAudioTranscriptionCompletedEvent = TTransportEventBase & {
  type: 'conversation.item.input_audio_transcription.completed';
  item_id?: string;
  content_index?: number;
  transcript?: string;
  usage?: TEventRecord;
};

export type TTranscriptionError = {
  code?: string;
  message?: string;
  param?: string;
  type?: string;
};

export type TConversationInputAudioTranscriptionFailedEvent = TTransportEventBase & {
  type: 'conversation.item.input_audio_transcription.failed';
  item_id?: string;
  content_index?: number;
  error?: TTranscriptionError;
};
