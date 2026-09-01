'use client';

import { renderTypedEvent } from '@/components/Events/renderers';
import { isKnownTransportEventType, TTransportEvent, TTransportEventType } from '@/types';
import { TAddEventFn, TEventsLogLevel } from '@/types/ChatStore';
import { TransportEvent } from '@openai/agents/realtime';

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
 * Transforms the transport event stream into `TRenderedEvent`s for the debug panel
 * (`components/Events`). Message extraction is a separate concern and lives in
 * `./messageExtractor`.
 *
 * @param te Incoming TransportEvent
 * @param addEventFn A function that adds events to our chatStore (zustand)
 * @param eventsLogLevel `verbose` renders every known event, `info` only the structural ones
 */
export const processEvent = (
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
