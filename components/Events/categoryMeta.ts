import { EEventCategory } from '@/types';

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
    hint: 'Conversation item boundaries: added, done, retrieved and truncated.',
  },
  {
    id: EEventCategory.Response,
    label: 'Response',
    hint: 'Response lifecycle: created/done, output items and content parts.',
  },
  {
    id: EEventCategory.Transcript,
    label: 'Transcript',
    hint: 'Finished transcripts and text for both sides of the turn, and failed transcriptions.',
  },
  {
    id: EEventCategory.Delta,
    label: 'Deltas',
    hint: 'Streaming chunks — transcript, text and tool-argument deltas. Hidden by default.',
  },
  {
    id: EEventCategory.Audio,
    label: 'Audio',
    hint: 'Input and output audio buffers, plus output audio completion.',
  },
  {
    id: EEventCategory.Tool,
    label: 'Tools',
    hint: 'Completed function-call arguments only. Argument deltas sit under Deltas and function_call items under Conversation / Response; the Settings "render tool calls" switch covers all of them.',
  },
  {
    id: EEventCategory.RateLimit,
    label: 'Rate limits',
    hint: 'rate_limits.updated snapshots.',
  },
];
