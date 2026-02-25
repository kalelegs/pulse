import { TTransportEvent } from '@/types';
import { formatTimestamp } from '../utils';
import { TRenderedEvent } from './types';

type TRenderedEventBase = Omit<TRenderedEvent, 'id' | 'rawEvent' | 'timestamp'>;

export const buildRenderedEvent = (event: TTransportEvent, payload: TRenderedEventBase): TRenderedEvent => {
  return {
    ...payload,
    id: event.event_id ?? event.type,
    rawEvent: event,
    timestamp: formatTimestamp(new Date()),
  };
};
