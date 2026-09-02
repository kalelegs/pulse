import type { TransportEvent } from '@openai/agents/realtime';
import {
  isKnownTransportEventType,
  TAddEventFn,
  TEventsLogLevel,
  TTransportEvent,
  TTransportEventType,
} from '@/types';
import { renderTypedEvent } from './renderEvent';

/**
 * Structural events that stay in the debug panel even at the `info` log level, because they are
 * what makes a turn readable: item boundaries, tool calls and audio playback.
 */
const ALWAYS_LOGGED_EVENT_TYPES = new Set<TTransportEventType>([
  'response.output_item.added',
  'response.output_item.done',
  'response.function_call_arguments.done',
  'conversation.item.added',
  'conversation.item.done',
  'output_audio_buffer.started',
  'output_audio_buffer.stopped',
]);

/**
 * The debug panel's ingest: renders one transport event into a `TRenderedEvent` and hands it to
 * the event log store. Message extraction is a separate concern and lives in
 * `lib/EventProcessor/messageExtractor`.
 *
 * @param te Incoming TransportEvent
 * @param addEventFn Appends to `useEventLogStore.events`
 * @param eventsLogLevel `verbose` renders every known event, `info` only the structural ones
 */
export const logTransportEvent = (
  te: TransportEvent,
  addEventFn: TAddEventFn,
  eventsLogLevel: TEventsLogLevel,
) => {
  const type = te.type;

  if (!isKnownTransportEventType(type)) {
    if (eventsLogLevel === 'verbose') {
      console.debug('unrendered transport event type', te);
    }
    return;
  }

  if (eventsLogLevel !== 'verbose' && !ALWAYS_LOGGED_EVENT_TYPES.has(type)) {
    return;
  }

  addEventFn(renderTypedEvent(te as TTransportEvent));
};
