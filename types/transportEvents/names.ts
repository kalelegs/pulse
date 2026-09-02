/**
 * Every transport event type the app renders. Adding a name here fails `tsc` in the two mapped
 * types built over it — `lib/events/categories.ts` and `lib/events/renderEvent.ts` — until a
 * category and a renderer exist (`components/Events/README.md`, "Adding a new event type").
 */
export const TRANSPORT_EVENT_TYPES = [
  'conversation.item.added',
  'conversation.item.done',
  'conversation.item.input_audio_transcription.completed',
  'conversation.item.input_audio_transcription.delta',
  'conversation.item.input_audio_transcription.failed',
  'conversation.item.retrieved',
  'conversation.item.truncated',
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
  'response.output_text.delta',
  'response.output_text.done',
  'session.created',
  'session.updated',
] as const;

export type TTransportEventType = (typeof TRANSPORT_EVENT_TYPES)[number];

/** A payload the app has not modelled field by field. Readers go through `readString` and co. */
export type TEventRecord = Record<string, unknown>;

export type TTransportEventBase = {
  type: TTransportEventType;
  event_id?: string;
};

export const isKnownTransportEventType = (value: unknown): value is TTransportEventType => {
  return typeof value === 'string' && TRANSPORT_EVENT_TYPES.includes(value as TTransportEventType);
};
