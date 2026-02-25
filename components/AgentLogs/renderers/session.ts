import { TSessionCreatedEvent, TSessionUpdatedEvent } from '@/types';
import { readString } from '../utils';
import { buildRenderedEvent } from './common';
import { toneSession } from './tones';
import { TRenderedEvent } from './types';

export const renderSessionCreated = (event: TSessionCreatedEvent): TRenderedEvent => {
  const model = readString(event.session?.model);
  return buildRenderedEvent(event, {
    kind: 'Session',
    title: 'Session created',
    summary: model ? `Model: ${model}` : 'Realtime session initialized',
    details: {
      event_id: event.event_id,
      session_id: readString(event.session?.id),
      model,
      output_modalities: event.session?.output_modalities,
    },
    tone: toneSession,
  });
};

export const renderSessionUpdated = (event: TSessionUpdatedEvent): TRenderedEvent => {
  const model = readString(event.session?.model);
  return buildRenderedEvent(event, {
    kind: 'Session',
    title: 'Session updated',
    summary: model ? `Model: ${model}` : 'Realtime session changed',
    details: {
      event_id: event.event_id,
      session_id: readString(event.session?.id),
      model,
      tool_choice: event.session?.tool_choice,
      output_modalities: event.session?.output_modalities,
    },
    tone: toneSession,
  });
};
