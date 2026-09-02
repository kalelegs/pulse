import type { TransportEvent } from '@openai/agents/realtime';

/**
 * The realtime transport hands us `{ type: string; [key: string]: any }`. These are the narrow
 * shapes the message extractor actually reads, verified against the zod schemas in
 * `@openai/agents-realtime/dist/openaiRealtimeEvents.d.ts`.
 */
export type TItemScopedPayload = {
  /** `item_id` of the conversation item the event belongs to. */
  item_id?: string;
};

export type TDeltaPayload = TItemScopedPayload & {
  /** Present on `response.output_audio_transcript.delta`, `response.output_text.delta` and
   *  `conversation.item.input_audio_transcription.delta`. */
  delta?: string;
};

export type TTranscriptDonePayload = TItemScopedPayload & {
  /** `response.output_audio_transcript.done` / `conversation.item...transcription.completed`. */
  transcript?: string;
  /** `response.output_text.done` carries `text` instead of `transcript`. */
  text?: string;
};

/**
 * `response.created` — the id every item of the response that follows is labelled with.
 */
export type TResponseCreatedPayload = {
  response?: {
    id?: string;
  };
};

/**
 * `response.done`. `status` is the enum verified at
 * `@openai/agents-realtime/dist/openaiRealtimeEvents.d.ts` (`responseDoneEventSchema`):
 * `in_progress | completed | incomplete | failed | cancelled`.
 */
export type TResponseDonePayload = {
  response?: {
    id?: string;
    status?: 'in_progress' | 'completed' | 'incomplete' | 'failed' | 'cancelled' | null;
  };
};

/**
 * Whether two response ids name the same response.
 *
 * An unknown id on either side counts as a match: a transport that does not label its responses
 * (or a hand-built event) must keep the single-response behaviour these guards were added to
 * refine, rather than silently stop settling turns.
 */
export const sameResponse = (a: string | undefined, b: string | undefined): boolean =>
  a === undefined || b === undefined || a === b;

export type TOutputItemPayload = {
  item?: {
    id?: string;
    /** `message`, `function_call`, `function_call_output`, ... */
    type?: string;
    role?: string;
  };
};

/** Reads a transport event as one of the narrow payloads above. */
export const asPayload = <TPayload>(event: TransportEvent): TPayload =>
  event as unknown as TPayload;
