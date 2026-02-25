export const TRANSPORT_EVENT_TYPES = [
  'conversation.item.added',
  'conversation.item.done',
  'conversation.item.input_audio_transcription.completed',
  'conversation.item.input_audio_transcription.delta',
  'conversation.item.retrieved',
  'input_audio_buffer.committed',
  'input_audio_buffer.speech_started',
  'input_audio_buffer.speech_stopped',
  'output_audio_buffer.started',
  'output_audio_buffer.stopped',
  'rate_limits.updated',
  'response.content_part.added',
  'response.content_part.done',
  'response.created',
  'response.done',
  'response.function_call_arguments.delta',
  'response.function_call_arguments.done',
  'response.output_audio.done',
  'response.output_audio_transcript.delta',
  'response.output_audio_transcript.done',
  'response.output_item.added',
  'response.output_item.done',
  'session.created',
  'session.updated',
] as const;

export type TTransportEventType = (typeof TRANSPORT_EVENT_TYPES)[number];

export type TEventRecord = Record<string, unknown>;

export type TTransportEventBase = {
  type: TTransportEventType;
  event_id?: string;
};

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

export type TSessionCreatedEvent = TTransportEventBase & {
  type: 'session.created';
  session?: TEventRecord;
};

export type TSessionUpdatedEvent = TTransportEventBase & {
  type: 'session.updated';
  session?: TEventRecord;
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

export type TInputAudioBufferCommittedEvent = TTransportEventBase & {
  type: 'input_audio_buffer.committed';
  item_id?: string;
  previous_item_id?: string | null;
};

export type TInputAudioBufferSpeechStartedEvent = TTransportEventBase & {
  type: 'input_audio_buffer.speech_started';
  item_id?: string;
  audio_start_ms?: number;
};

export type TInputAudioBufferSpeechStoppedEvent = TTransportEventBase & {
  type: 'input_audio_buffer.speech_stopped';
  item_id?: string;
  audio_end_ms?: number;
};

export type TOutputAudioBufferStartedEvent = TTransportEventBase & {
  type: 'output_audio_buffer.started';
  response_id?: string;
};

export type TOutputAudioBufferStoppedEvent = TTransportEventBase & {
  type: 'output_audio_buffer.stopped';
  response_id?: string;
};

export type TRateLimit = {
  name?: string;
  limit?: number;
  remaining?: number;
  reset_seconds?: number;
  [key: string]: unknown;
};

export type TRateLimitsUpdatedEvent = TTransportEventBase & {
  type: 'rate_limits.updated';
  rate_limits?: TRateLimit[];
};

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

export type TTransportEvent =
  | TConversationItemAddedEvent
  | TConversationItemDoneEvent
  | TConversationInputAudioTranscriptionCompletedEvent
  | TConversationInputAudioTranscriptionDeltaEvent
  | TConversationItemRetrievedEvent
  | TInputAudioBufferCommittedEvent
  | TInputAudioBufferSpeechStartedEvent
  | TInputAudioBufferSpeechStoppedEvent
  | TOutputAudioBufferStartedEvent
  | TOutputAudioBufferStoppedEvent
  | TRateLimitsUpdatedEvent
  | TResponseContentPartAddedEvent
  | TResponseContentPartDoneEvent
  | TResponseCreatedEvent
  | TResponseDoneEvent
  | TResponseFunctionCallArgumentsDeltaEvent
  | TResponseFunctionCallArgumentsDoneEvent
  | TResponseOutputAudioDoneEvent
  | TResponseOutputAudioTranscriptDeltaEvent
  | TResponseOutputAudioTranscriptDoneEvent
  | TResponseOutputItemAddedEvent
  | TResponseOutputItemDoneEvent
  | TSessionCreatedEvent
  | TSessionUpdatedEvent;

export type TUnknownTransportEvent = {
  type: string;
  event_id?: string;
  [key: string]: unknown;
};

export const isKnownTransportEventType = (value: unknown): value is TTransportEventType => {
  return typeof value === 'string' && TRANSPORT_EVENT_TYPES.includes(value as TTransportEventType);
};

export const asTransportEvent = (value: unknown): TTransportEvent | TUnknownTransportEvent => {
  if (typeof value !== 'object' || value === null) {
    return { type: 'unknown', event_id: undefined };
  }

  const candidate = value as Record<string, unknown>;
  const type = candidate.type;
  if (isKnownTransportEventType(type)) {
    return candidate as TTransportEvent;
  }
  return {
    ...(candidate as Record<string, unknown>),
    type: typeof type === 'string' ? type : 'unknown',
  } as TUnknownTransportEvent;
};
