import type { TConversationItem } from './conversation';
import type { TEventRecord, TTransportEventBase } from './names';

export type TResponseCreatedEvent = TTransportEventBase & {
  type: 'response.created';
  response?: TEventRecord;
};

export type TResponseDoneEvent = TTransportEventBase & {
  type: 'response.done';
  response?: TEventRecord;
};

export type TResponseOutputItemAddedEvent = TTransportEventBase & {
  type: 'response.output_item.added';
  response_id?: string;
  output_index?: number;
  item?: TConversationItem;
};

export type TResponseOutputItemDoneEvent = TTransportEventBase & {
  type: 'response.output_item.done';
  response_id?: string;
  output_index?: number;
  item?: TConversationItem;
};

export type TResponseContentPartAddedEvent = TTransportEventBase & {
  type: 'response.content_part.added';
  response_id?: string;
  item_id?: string;
  output_index?: number;
  content_index?: number;
  part?: TEventRecord;
};

export type TResponseContentPartDoneEvent = TTransportEventBase & {
  type: 'response.content_part.done';
  response_id?: string;
  item_id?: string;
  output_index?: number;
  content_index?: number;
  part?: TEventRecord;
};

export type TResponseOutputAudioTranscriptDeltaEvent = TTransportEventBase & {
  type: 'response.output_audio_transcript.delta';
  response_id?: string;
  item_id?: string;
  output_index?: number;
  content_index?: number;
  delta?: string;
};

export type TResponseOutputAudioTranscriptDoneEvent = TTransportEventBase & {
  type: 'response.output_audio_transcript.done';
  response_id?: string;
  item_id?: string;
  output_index?: number;
  content_index?: number;
  transcript?: string;
};

export type TResponseOutputAudioDoneEvent = TTransportEventBase & {
  type: 'response.output_audio.done';
  response_id?: string;
  item_id?: string;
  output_index?: number;
  content_index?: number;
};

/** Text-only assistant turns stream through these instead of the audio-transcript pair. */
export type TResponseOutputTextDeltaEvent = TTransportEventBase & {
  type: 'response.output_text.delta';
  response_id?: string;
  item_id?: string;
  output_index?: number;
  content_index?: number;
  delta?: string;
};

export type TResponseOutputTextDoneEvent = TTransportEventBase & {
  type: 'response.output_text.done';
  response_id?: string;
  item_id?: string;
  output_index?: number;
  content_index?: number;
  text?: string;
};

export type TResponseFunctionCallArgumentsDeltaEvent = TTransportEventBase & {
  type: 'response.function_call_arguments.delta';
  response_id?: string;
  item_id?: string;
  output_index?: number;
  call_id?: string;
  delta?: string;
};

export type TResponseFunctionCallArgumentsDoneEvent = TTransportEventBase & {
  type: 'response.function_call_arguments.done';
  response_id?: string;
  item_id?: string;
  output_index?: number;
  call_id?: string;
  arguments?: string;
};
