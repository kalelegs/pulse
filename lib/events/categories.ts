import { EEventCategory, TRenderedEvent, TTransportEventType } from '@/types';

/**
 * Maps every transport event type to its category.
 *
 * Written as a mapped type over `TTransportEventType` — the same trick `renderEvent.ts` uses — so an
 * event type added to `TRANSPORT_EVENT_TYPES` without a category here fails `tsc`. There is
 * deliberately no fallback bucket: an uncategorised event would silently vanish from every chip.
 */
type TEventCategoryByType = {
  [K in TTransportEventType]: EEventCategory;
};

export const EVENT_CATEGORY_BY_TYPE: TEventCategoryByType = {
  'session.created': EEventCategory.Session,
  'session.updated': EEventCategory.Session,

  'conversation.item.added': EEventCategory.Conversation,
  'conversation.item.done': EEventCategory.Conversation,
  'conversation.item.retrieved': EEventCategory.Conversation,
  'conversation.item.truncated': EEventCategory.Conversation,

  'response.created': EEventCategory.Response,
  'response.done': EEventCategory.Response,
  'response.output_item.added': EEventCategory.Response,
  'response.output_item.done': EEventCategory.Response,
  'response.content_part.added': EEventCategory.Response,
  'response.content_part.done': EEventCategory.Response,

  'response.output_audio_transcript.done': EEventCategory.Transcript,
  'response.output_text.done': EEventCategory.Transcript,
  'conversation.item.input_audio_transcription.completed': EEventCategory.Transcript,
  'conversation.item.input_audio_transcription.failed': EEventCategory.Transcript,

  // Incremental chunks only. They are ~70% of a real log, which is why they are the one category
  // that starts hidden.
  'response.output_audio_transcript.delta': EEventCategory.Delta,
  'response.output_text.delta': EEventCategory.Delta,
  'conversation.item.input_audio_transcription.delta': EEventCategory.Delta,
  'response.function_call_arguments.delta': EEventCategory.Delta,

  'input_audio_buffer.committed': EEventCategory.Audio,
  'input_audio_buffer.speech_started': EEventCategory.Audio,
  'input_audio_buffer.speech_stopped': EEventCategory.Audio,
  'output_audio_buffer.started': EEventCategory.Audio,
  'output_audio_buffer.stopped': EEventCategory.Audio,
  'response.output_audio.done': EEventCategory.Audio,

  'response.function_call_arguments.done': EEventCategory.Tool,

  'rate_limits.updated': EEventCategory.RateLimit,
};

/** The category a rendered event belongs to. Total — every known event type is mapped. */
export const getEventCategory = (event: TRenderedEvent): EEventCategory =>
  EVENT_CATEGORY_BY_TYPE[event.rawEvent.type];

/**
 * Everything a reader would call "a tool call": the `Tool` category (completed arguments), the
 * argument deltas that precede it, and the conversation / output items that carry a
 * `function_call` or its `function_call_output`. Wider than the Tools chip on purpose — the chips
 * partition by event type, this cuts across categories — and it is the one definition the
 * Settings "render tool calls" switch applies.
 */
export const isToolCallEvent = (event: TRenderedEvent): boolean => {
  const raw = event.rawEvent;
  if (
    getEventCategory(event) === EEventCategory.Tool ||
    raw.type === 'response.function_call_arguments.delta'
  ) {
    return true;
  }
  const itemType = 'item' in raw ? raw.item?.type : undefined;
  return itemType === 'function_call' || itemType === 'function_call_output';
};
