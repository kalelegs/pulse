// `import type`, not a plain import — and the same on the other edge, in `types/ChatStore.tsx`.
// `@/types` re-exports `ChatStore`, which imports this module and `./renderers/types`; both import
// `@/types` straight back. That cycle is harmless only while every edge is erased at compile time.
// A value import on either side would pull the whole Events tree into every bundle that touches
// `@/types` — which `agents/`, `hooks/useSession` and `tools/` all do — and make the cycle real at
// runtime. `import type` is the compiler enforcing that rather than a convention to remember.
import type { TTransportEventType } from '@/types';
import type { TRenderedEvent } from './renderers/types';

/**
 * The buckets the debug panel groups transport events into.
 *
 * One event type belongs to exactly one category, so the chips partition the log rather than
 * overlap: turning every chip on shows everything, turning one off can only ever hide its own
 * events.
 */
export enum EEventCategory {
  Session = 'session',
  Conversation = 'conversation',
  Response = 'response',
  Transcript = 'transcript',
  Delta = 'delta',
  Audio = 'audio',
  Tool = 'tool',
  RateLimit = 'rateLimit',
}

/**
 * Maps every transport event type to its category.
 *
 * Written as a mapped type over `TTransportEventType` — the same trick `TRendererMap` uses — so an
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

  'response.created': EEventCategory.Response,
  'response.done': EEventCategory.Response,
  'response.output_item.added': EEventCategory.Response,
  'response.output_item.done': EEventCategory.Response,
  'response.content_part.added': EEventCategory.Response,
  'response.content_part.done': EEventCategory.Response,

  'response.output_audio_transcript.done': EEventCategory.Transcript,
  'conversation.item.input_audio_transcription.completed': EEventCategory.Transcript,

  // Incremental chunks only. They are ~70% of a real log, which is why they are the one category
  // that starts hidden.
  'response.output_audio_transcript.delta': EEventCategory.Delta,
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

/** Chip metadata: what the category is called and what it covers. */
export type TEventCategoryMeta = {
  id: EEventCategory;
  /** Chip label. Kept short — eight of these share one narrow column. */
  label: string;
  /** Tooltip copy, so a reader never has to guess what a chip covers. */
  hint: string;
};

/** Chip order, roughly the order a turn moves through the transport. */
export const EVENT_CATEGORIES: readonly TEventCategoryMeta[] = [
  {
    id: EEventCategory.Session,
    label: 'Session',
    hint: 'Session lifecycle: session.created and session.updated.',
  },
  {
    id: EEventCategory.Conversation,
    label: 'Conversation',
    hint: 'Conversation item boundaries: added, done and retrieved.',
  },
  {
    id: EEventCategory.Response,
    label: 'Response',
    hint: 'Response lifecycle: created/done, output items and content parts.',
  },
  {
    id: EEventCategory.Transcript,
    label: 'Transcript',
    hint: 'Finished transcripts for both sides of the turn.',
  },
  {
    id: EEventCategory.Delta,
    label: 'Deltas',
    hint: 'Streaming chunks — transcript and tool-argument deltas. Hidden by default.',
  },
  {
    id: EEventCategory.Audio,
    label: 'Audio',
    hint: 'Input and output audio buffers, plus output audio completion.',
  },
  {
    id: EEventCategory.Tool,
    label: 'Tools',
    hint: 'Completed function call arguments.',
  },
  {
    id: EEventCategory.RateLimit,
    label: 'Rate limits',
    hint: 'rate_limits.updated snapshots.',
  },
];

/**
 * Categories hidden the first time the panel is opened.
 *
 * Only deltas: a captured session logged 126 delta events against 58 of everything else, so
 * hiding them is what collapses a turn to a readable handful without losing a single boundary.
 */
export const DEFAULT_HIDDEN_CATEGORIES: readonly EEventCategory[] = [EEventCategory.Delta];

/** The category a rendered event belongs to. Total — every known event type is mapped. */
export const getEventCategory = (event: TRenderedEvent): EEventCategory =>
  EVENT_CATEGORY_BY_TYPE[event.rawEvent.type];
