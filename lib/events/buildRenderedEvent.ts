import { TRenderedEvent, TTransportEvent } from '@/types';
import { formatTimestamp } from './fields';

type TRenderedEventBase = Pick<TRenderedEvent, 'kind' | 'title' | 'summary'>;

/** Stamps the id, the raw event and the render time onto what a renderer worked out. */
export const buildRenderedEvent = (
  event: TTransportEvent,
  payload: TRenderedEventBase,
): TRenderedEvent => {
  return {
    ...payload,
    id: event.event_id ?? event.type,
    rawEvent: event,
    timestamp: formatTimestamp(new Date()),
  };
};
