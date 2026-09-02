import { EEventKind, TRenderedEvent, TSessionCreatedEvent, TSessionUpdatedEvent } from '@/types';
import { buildRenderedEvent } from '../buildRenderedEvent';
import { readString } from '../fields';

export const renderSessionCreated = (event: TSessionCreatedEvent): TRenderedEvent => {
  const model = readString(event.session?.model);
  return buildRenderedEvent(event, {
    kind: EEventKind.Session,
    title: 'Session created',
    summary: model ? `Model: ${model}` : 'Realtime session initialized',
  });
};

export const renderSessionUpdated = (event: TSessionUpdatedEvent): TRenderedEvent => {
  const model = readString(event.session?.model);
  return buildRenderedEvent(event, {
    kind: EEventKind.Session,
    title: 'Session updated',
    summary: model ? `Model: ${model}` : 'Realtime session changed',
  });
};
