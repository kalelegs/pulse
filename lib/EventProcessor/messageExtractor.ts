'use client';

import { isKnownTransportEventType, type TMessageSink, type TTransportEventType } from '@/types';
import type { TransportEvent } from '@openai/agents/realtime';
import { createAssistantTurnTracker } from './assistantTurn';
import { createToolCallTracker } from './toolCalls';
import { createTurnClock } from './turnClock';
import { createUserTurnTracker } from './userTurn';

/** Assistant transcript deltas. Audio turns emit the first, text-only turns the second. */
const ASSISTANT_DELTA_TYPES = new Set<TTransportEventType>([
  'response.output_audio_transcript.delta',
  'response.output_text.delta',
]);

/** Authoritative end of an assistant item — carries the full transcript / text. */
const ASSISTANT_DONE_TYPES = new Set<TTransportEventType>([
  'response.output_audio_transcript.done',
  'response.output_text.done',
]);

export type TMessageExtractor = {
  /** Feed every transport event here, in arrival order. */
  processEvent: (event: TransportEvent) => void;
  /**
   * Ends the session: finalises whatever the user already heard, then drops all in-flight turn
   * state. `components/RealtimeExperience` calls it from both `useSession` callbacks — `onConnect`
   * (so a fresh transcript starts clean) and `onDisconnect`.
   */
  reset: () => void;
};

/**
 * Turns the realtime transport event stream into chat messages.
 *
 * This is the message half of the transport pipeline; `logTransportEvent` in
 * `lib/events/logTransportEvent` is the debug-panel half, and the two share nothing. Per-role bookkeeping lives in `./assistantTurn` and
 * `./userTurn`; this module only routes events and owns the turn clock.
 *
 * Text turns injected by the app (`session.sendMessage`) are deliberately not rendered — they are
 * instructions to the model, not user speech.
 *
 * @param sink Where messages are written (in practice `chatMessageSink`, the zustand chat store).
 */
export const createMessageExtractor = (sink: TMessageSink): TMessageExtractor => {
  const clock = createTurnClock();
  const assistant = createAssistantTurnTracker(sink, clock);
  const user = createUserTurnTracker(sink, clock);
  const tools = createToolCallTracker(sink);

  const processEvent = (event: TransportEvent) => {
    // Narrowed to the app's known-type list so every `case` below must name a type that list
    // carries: a handler for an event the debug panel does not know about fails `tsc` instead of
    // quietly diverging from it.
    const { type } = event;
    if (!isKnownTransportEventType(type)) {
      return;
    }

    if (ASSISTANT_DELTA_TYPES.has(type)) {
      assistant.handleDelta(event);
      return;
    }
    if (ASSISTANT_DONE_TYPES.has(type)) {
      assistant.handleDone(event);
      return;
    }
    switch (type) {
      case 'input_audio_buffer.speech_started':
        // The only event that means "the user started talking", so the only one that may start
        // the speech clock every user `TDuration` is measured against.
        clock.startSpeech();
        assistant.handleInterruption();
        user.handleSpeechStarted(event);
        break;
      case 'conversation.item.truncated':
        // The server acknowledging that the *assistant's* audio was cut short (payload: `item_id`,
        // `audio_end_ms`, `content_index`). It follows `speech_started` by ~200ms, so restarting
        // the speech clock here used to understate every user duration by the barge-in latency.
        assistant.handleInterruption();
        break;
      case 'response.created':
        clock.startResponse();
        // Every item that follows belongs to this response, and anything the previous one left
        // open is now stale. See `./responseTracker`.
        assistant.handleResponseCreated(event);
        break;
      case 'response.output_item.added':
        assistant.handleOutputItemAdded(event);
        break;
      case 'response.output_item.done':
        tools.handleOutputItemDone(event);
        break;
      case 'conversation.item.added':
        tools.handleItemAdded(event);
        break;
      case 'response.done':
        assistant.handleResponseDone(event);
        break;
      case 'output_audio_buffer.started':
        assistant.recordAudioStart();
        break;
      case 'output_audio_buffer.stopped':
        assistant.recordAudioEnd();
        break;
      case 'input_audio_buffer.committed':
        user.handleCommitted(event);
        break;
      case 'conversation.item.input_audio_transcription.delta':
        user.handleTranscriptDelta(event);
        break;
      case 'conversation.item.input_audio_transcription.completed':
        user.handleTranscriptCompleted(event);
        break;
      case 'conversation.item.input_audio_transcription.failed':
        user.handleTranscriptFailed(event);
        break;
      default:
        break;
    }
  };

  // The trackers run first: closing an in-flight message stamps its `textEnd` off the clock, so
  // resetting the clock before them would zero the duration of the last thing the user heard.
  const reset = () => {
    assistant.reset();
    user.reset();
    tools.reset();
    clock.reset();
  };

  return { processEvent, reset };
};
