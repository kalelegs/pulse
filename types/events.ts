import type { TTransportEvent } from './transportEvents';

/**
 * The buckets the debug panel groups transport events into.
 *
 * One event type belongs to exactly one category, so the chips partition the log rather than
 * overlap: turning every chip on shows everything, turning one off can only ever hide its own
 * events. The mapping lives in `lib/events/categories.ts`.
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
 * The badge a rendered event wears. Finer than `EEventCategory` — a `Response` category event may
 * be a handoff, a selected tool or a plain output item — and the key `components/Events/tones.ts`
 * colours rows by. The values are the badge text.
 */
export enum EEventKind {
  Session = 'Session',
  Conversation = 'Conversation',
  Response = 'Response',
  Stream = 'Stream',
  InputAudio = 'Input Audio',
  AudioStart = 'Audio Start',
  AudioDone = 'Audio Done',
  ToolSelected = 'Tool Selected',
  ToolRequest = 'Tool Request',
  Tool = 'Tool',
  Handoff = 'Handoff',
  RateLimit = 'Rate Limit',
}

/** Tailwind classes for a row's card and badge. */
export type TRenderTone = {
  card: string;
  badge: string;
};

/** A transport event reduced to what the debug panel prints, plus the raw event for the JSON view. */
export type TRenderedEvent = {
  id: string;
  kind: EEventKind;
  title: string;
  summary: string;
  rawEvent: TTransportEvent;
  /** Wall-clock `HH:MM:SS.mmm` at render time. */
  timestamp: string;
};
